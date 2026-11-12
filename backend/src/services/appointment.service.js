const sequelize = require("../config/database");
const appointmentRepository = require("../repositories/appointment.repository");
const slotRepository = require("../repositories/bookable_slot.repository");
const doctorRepository = require("../repositories/doctor.repository");
const patientRepository = require("../repositories/patient.repository");
const ApiError = require("../utils/apiError");
const sendMail = require("../utils/sendMail");
const notificationService = require("../services/notification.service");
const { invalidateDoctorCache } = require("./doctor.service");
const { emitToDoctor } = require("../utils/socket");
const { parsePagination, buildPaginationMeta } = require("../utils/pagination");
const { todayStr, nowTimeStr, normalizeTime } = require("../utils/dateHelper");
const {
  ALLOWED_STATUS_TRANSITIONS,
  SLOT_STATUSES_THAT_REOPEN,
  PATIENT_CANCEL_FROM,
} = require("../constants/appointment.constants");

const slotDateStr = (slotDate) => {
  if (!slotDate) return "";
  if (typeof slotDate === "string") return slotDate.slice(0, 10);
  const d = new Date(slotDate);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const isSlotInPast = (slot) => {
  const date = slotDateStr(slot.slot_date);
  const today = todayStr();
  if (date < today) return true;
  if (date > today) return false;
  return normalizeTime(slot.start_time) <= nowTimeStr();
};

const assertStatusTransition = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) {
    throw new ApiError(400, `Lịch hẹn đã ở trạng thái '${newStatus}'`);
  }
  if (!Object.prototype.hasOwnProperty.call(ALLOWED_STATUS_TRANSITIONS, currentStatus)) {
    throw new ApiError(400, `Trạng thái hiện tại không hợp lệ: '${currentStatus}'`);
  }
  if (!ALLOWED_STATUS_TRANSITIONS[currentStatus].includes(newStatus)) {
    throw new ApiError(
      400,
      `Không thể chuyển trạng thái từ '${currentStatus}' sang '${newStatus}'`
    );
  }
};

const resolveOrCreatePatient = async (data, transaction) => {
  let patientId = data.patient_id;
  if (!patientId && data.phone_number) {
    let patient = await patientRepository.findPatientByPhone(data.phone_number, transaction);
    if (!patient) {
      patient = await patientRepository.createPatient(
        {
          full_name: data.patient_name || "Bệnh nhân",
          phone_number: data.phone_number,
          email: data.email || "",
          address: data.address || "",
          password: "",
        },
        transaction
      );
    } else {
      await patientRepository.updatePatient(
        patient.id,
        {
          full_name: data.patient_name || patient.full_name,
          email: data.email || patient.email || "",
          address: data.address || patient.address || "",
          phone_number: data.phone_number,
        },
        transaction
      );
      patient = await patientRepository.findPatientById(patient.id, transaction);
    }
    patientId = patient.id;
  }
  if (!patientId) {
    throw new ApiError(400, "Cần cung cấp thông tin bệnh nhân (số điện thoại)");
  }
  return patientId;
};

const sendSideEffectsSafely = async (fn, label) => {
  try {
    await fn();
  } catch (err) {
    console.error(`${label}:`, err.message);
  }
};

const notifyStatusChange = async (doctorId, patientId, newStatus) => {
  const copy = {
    confirmed: ["Lịch hẹn đã được xác nhận", "Bác sĩ đã xác nhận lịch hẹn của bạn"],
    cancelled: ["Lịch hẹn đã bị hủy", "Lịch hẹn của bạn đã bị hủy"],
    missed: ["Bạn đã bỏ lỡ lịch hẹn", "Bạn đã không đến buổi khám"],
    completed: ["Buổi khám đã hoàn thành", "Buổi khám của bạn đã kết thúc"],
  };
  const pair = copy[newStatus];
  if (!pair) return;
  await notificationService.createNotification(doctorId, patientId, pair[0], pair[1]);
};

const listAppointments = async (doctorId, query = {}) => {
  const { page, limit } = parsePagination(query);
  const status = query.status && query.status !== "all" ? query.status : undefined;
  const date = query.date || undefined;

  const { rows, count } = await appointmentRepository.listAppointmentsByDoctor({
    doctorId,
    status,
    date,
    page,
    limit,
  });

  return {
    items: rows,
    pagination: buildPaginationMeta(page, limit, count),
  };
};

const getAppointmentsByDoctorId = async (doctorId) => {
  const result = await listAppointments(doctorId, { page: 1, limit: 50 });
  return result.items;
};

const getAppointmentDetail = async (appointmentId, doctorId) => {
  const owned = await appointmentRepository.getAppointmentDetail(appointmentId, doctorId);
  if (owned) return owned;

  const exists = await appointmentRepository.findAppointmentById(appointmentId);
  if (!exists) {
    throw new ApiError(404, "Không tìm thấy chi tiết lịch hẹn");
  }
  throw new ApiError(403, "Bạn không có quyền xem lịch hẹn của bác sĩ khác");
};

const getAppointmentsByStatus = async (doctorId, status) => {
  const result = await listAppointments(doctorId, { status, page: 1, limit: 50 });
  return result.items;
};

const getAppointmentsByDate = async (doctorId, date) => {
  const result = await listAppointments(doctorId, { date, page: 1, limit: 50 });
  return result.items;
};

const createAppointment = async (data) => {
  const booked = await sequelize.transaction(async (t) => {
    const slot = await slotRepository.findSlotByIdForUpdate(data.bookable_slot_id, t);
    if (!slot) {
      throw new ApiError(404, "Slot không tồn tại");
    }
    if (slot.status === "booked") {
      throw new ApiError(409, "Slot đã được đặt");
    }
    if (slot.status === "off") {
      throw new ApiError(400, "Bác sĩ bận khung giờ này");
    }
    if (isSlotInPast(slot)) {
      throw new ApiError(400, "Không thể đặt lịch cho khung giờ trong quá khứ");
    }

    const patientId = await resolveOrCreatePatient(data, t);

    const locked = await slotRepository.markSlotBookedIfAvailable(slot.id, t);
    if (locked === 0) {
      throw new ApiError(409, "Slot vừa được người khác đặt");
    }

    const appointment = await appointmentRepository.createAppointment(
      {
        bookable_slot_id: data.bookable_slot_id,
        patient_id: patientId,
        reason_for_visit: data.reason_for_visit || "Khám tổng quát",
        note: data.note || "",
        price: data.price || 0,
        payment_method: data.payment_method === "online" ? "online" : "offline",
        status: "pending",
        payment_status: "pending",
      },
      t
    );

    return { appointment, slot, patientId };
  });

  const { appointment, slot, patientId } = booked;
  invalidateDoctorCache(slot.doctor_id);

  const doctor = await doctorRepository.findDoctorById(slot.doctor_id);
  const patient = await patientRepository.findPatientById(patientId);

  await sendSideEffectsSafely(
    () =>
      notificationService.createNotification(
        slot.doctor_id,
        patientId,
        "Lịch hẹn mới",
        "Có bệnh nhân vừa đặt lịch khám"
      ),
    "Không tạo được thông báo lịch hẹn"
  );

  await sendSideEffectsSafely(() => {
    emitToDoctor(slot.doctor_id, "appointment:new", {
      appointmentId: appointment.id,
      appointmentCode: appointment.appointment_code,
      bookableSlotId: data.bookable_slot_id,
      slot: {
        id: slot.id,
        slot_date: slot.slot_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        status: "booked",
      },
      patient: {
        id: patientId,
        full_name: patient?.full_name || data.patient_name || "Bệnh nhân",
        phone_number: patient?.phone_number || data.phone_number,
      },
      appointment: {
        ...(appointment.toJSON ? appointment.toJSON() : appointment),
        BookableSlot: slot,
        Patient: patient,
      },
    });
  }, "[Socket] Emit appointment:new thất bại");

  const htmlContent = `
    <div style="font-family: Arial; padding:20px">
        <h2 style="color:#2c7be5;">Bạn có lịch hẹn khám mới</h2>
        <p>Xin chào, <b>${doctor?.full_name || "Bác sĩ"}</b></p>
        <p>Một bệnh nhân vừa đặt lịch khám trên hệ thống.</p>
        <table style="border-collapse: collapse; width:100%; margin-top:15px">
            <tr>
                <td style="padding:8px;border:1px solid #ddd"><b>Bệnh nhân</b></td>
                <td style="padding:8px;border:1px solid #ddd">${patient?.full_name || data.patient_name}</td>
            </tr>
            <tr>
                <td style="padding:8px;border:1px solid #ddd"><b>Mã lịch hẹn</b></td>
                <td style="padding:8px;border:1px solid #ddd">${appointment.appointment_code}</td>
            </tr>
            <tr>
                <td style="padding:8px;border:1px solid #ddd"><b>Lý do khám</b></td>
                <td style="padding:8px;border:1px solid #ddd">${data.reason_for_visit || "Khám tổng quát"}</td>
            </tr>
            <tr>
                <td style="padding:8px;border:1px solid #ddd"><b>Giá khám</b></td>
                <td style="padding:8px;border:1px solid #ddd">${data.price || 0} VNĐ</td>
            </tr>
            <tr>
                <td style="padding:8px;border:1px solid #ddd"><b>Phương thức thanh toán</b></td>
                <td style="padding:8px;border:1px solid #ddd">${data.payment_method || "offline"}</td>
            </tr>
        </table>
        <p style="margin-top:20px">Vui lòng đăng nhập hệ thống để xem chi tiết lịch hẹn.</p>
        <p style="color:gray;font-size:13px">Đây là email tự động từ hệ thống đặt lịch khám.</p>
    </div>
    `;

  await sendSideEffectsSafely(async () => {
    if (doctor?.email) {
      await sendMail(doctor.email, "Bạn có lịch hẹn khám mới", htmlContent);
    }
  }, "Gửi mail lịch hẹn thất bại");

  return appointment;
};

const applyStatusChange = async ({ appointment, newStatus, transaction }) => {
  const slotInfo = appointment.BookableSlot;
  if (!slotInfo || !slotInfo.id) {
    throw new ApiError(400, "Lịch hẹn không có thông tin slot");
  }

  await slotRepository.findSlotByIdForUpdate(slotInfo.id, transaction);
  assertStatusTransition(appointment.status, newStatus);

  await appointmentRepository.updateAppointmentStatus(appointment.id, newStatus, transaction);

  if (SLOT_STATUSES_THAT_REOPEN.includes(newStatus)) {
    await slotRepository.updateSlotStatus(slotInfo.id, "available", transaction);
  }

  return slotInfo;
};

const updateAppointmentStatus = async (appointmentId, newStatus, doctorId) => {
  const { slotInfo, patientId } = await sequelize.transaction(async (t) => {
    const owned = await appointmentRepository.getAppointmentDetail(appointmentId, doctorId, {
      transaction: t,
      lock: true,
    });

    if (!owned) {
      const exists = await appointmentRepository.findAppointmentById(appointmentId, {
        transaction: t,
      });
      if (!exists) {
        throw new ApiError(404, "Không tìm thấy lịch hẹn");
      }
      throw new ApiError(403, "Bạn không có quyền sửa lịch hẹn của bác sĩ khác");
    }

    const slotInfo = await applyStatusChange({
      appointment: owned,
      newStatus,
      transaction: t,
    });

    return { slotInfo, patientId: owned.patient_id };
  });

  if (SLOT_STATUSES_THAT_REOPEN.includes(newStatus)) {
    invalidateDoctorCache(slotInfo.doctor_id);
  }

  await sendSideEffectsSafely(
    () => notifyStatusChange(slotInfo.doctor_id, patientId, newStatus),
    "Không tạo được thông báo đổi trạng thái"
  );

  return appointmentRepository.getAppointmentDetail(appointmentId, doctorId);
};

const cancelAppointmentByCode = async (appointmentCode, phoneNumber) => {
  if (!phoneNumber) {
    throw new ApiError(400, "Số điện thoại là bắt buộc để hủy lịch");
  }

  const cancelled = await sequelize.transaction(async (t) => {
    const appointment = await appointmentRepository.findByAppointmentCode(appointmentCode, {
      transaction: t,
      lock: true,
    });
    if (!appointment) {
      throw new ApiError(404, `Không tìm thấy lịch hẹn với mã: ${appointmentCode}`);
    }

    const phone = appointment.Patient?.phone_number;
    if (!phone || String(phone).trim() !== String(phoneNumber).trim()) {
      throw new ApiError(403, "Số điện thoại không khớp với lịch hẹn");
    }

    if (!PATIENT_CANCEL_FROM.includes(appointment.status)) {
      throw new ApiError(
        400,
        `Không thể hủy lịch đang ở trạng thái '${appointment.status}'`
      );
    }

    await slotRepository.findSlotByIdForUpdate(appointment.bookable_slot_id, t);
    const slotInfo = await applyStatusChange({
      appointment,
      newStatus: "cancelled",
      transaction: t,
    });

    return { appointment, slotInfo };
  });

  invalidateDoctorCache(cancelled.slotInfo.doctor_id);

  await sendSideEffectsSafely(
    () =>
      notifyStatusChange(
        cancelled.slotInfo.doctor_id,
        cancelled.appointment.patient_id,
        "cancelled"
      ),
    "Không tạo được thông báo hủy lịch"
  );

  return appointmentRepository.findByAppointmentCode(appointmentCode);
};

const getAppointmentByCode = async (appointmentCode) => {
  const appointment = await appointmentRepository.findByAppointmentCode(appointmentCode);
  if (!appointment) {
    throw new ApiError(404, `Không tìm thấy lịch hẹn với mã: ${appointmentCode}`);
  }
  return appointment;
};

module.exports = {
  listAppointments,
  getAppointmentsByDoctorId,
  getAppointmentDetail,
  getAppointmentsByStatus,
  getAppointmentsByDate,
  createAppointment,
  updateAppointmentStatus,
  cancelAppointmentByCode,
  getAppointmentByCode,
};
