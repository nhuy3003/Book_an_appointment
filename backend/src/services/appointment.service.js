const appointmentRepository = require("../repositories/appointment.repository");
const slotRepository = require("../repositories/bookable_slot.repository");
const doctorRepository = require("../repositories/doctor.repository");
const patientRepository = require("../repositories/patient.repository");
const ApiError = require("../utils/ApiError");
const sendMail = require("../utils/sendMail");
const notificationService = require("../services/notification.service");

// Lấy danh sách lịch hẹn của bác sĩ
const getAppointmentsByDoctorId = async (doctorId) => {
    const appointments = await appointmentRepository.getAppointmentsByDoctorId(doctorId);

    if (!appointments || appointments.length === 0) {
        throw new ApiError(404, "Không có lịch hẹn nào");
    }

    return appointments;
};

// Lấy chi tiết lịch hẹn
const getAppointmentDetail = async (appointmentId, doctorId) => {

    const appointment =
        await appointmentRepository.getAppointmentDetail(appointmentId, doctorId);

    // Nếu không tìm thấy hoặc lịch hẹn không thuộc về bác sĩ này
    if (!appointment) {
        throw new ApiError(404, "Không tìm thấy chi tiết lịch hẹn");
    }

    return appointment;
};

// Lọc lịch hẹn theo tình trạng
const getAppointmentsByStatus = async (doctorId, status) => {
    const appointments = await appointmentRepository.getAppointmentsByStatus(doctorId, status);

    if (!appointments || appointments.length === 0) {
        throw new ApiError(404, "Không tìm thấy lịch hẹn theo tình trạng");
    }

    return appointments;
};

// Lọc lịch hẹn theo ngày khám
const getAppointmentsByDate = async (doctorId, date) => {
    const appointments = await appointmentRepository.getAppointmentsByDate(doctorId, date);

    if (!appointments || appointments.length === 0) {
        throw new ApiError(404, "Không tìm thấy lịch hẹn theo ngày khám");
    }

    return appointments;
};

// Tạo lịch hẹn 
const createAppointment = async (data) => {

    const slot = await slotRepository.findSlotById(data.bookable_slot_id);

    if (!slot) {
        throw new ApiError(404, "Slot không tồn tại");
    }

    if (slot.status === "booked") {
        throw new ApiError(400, "Slot đã được đặt");
    }

    if (slot.status === "off") {
        throw new ApiError(400, "Bác sĩ bận ngày này");
    }

    // Nếu không có patient_id, tự động tìm hoặc tạo patient theo số điện thoại
    let patientId = data.patient_id;
    if (!patientId && data.phone_number) {
        let patient = await patientRepository.findPatientByPhone(data.phone_number);
        if (!patient) {
            patient = await patientRepository.createPatient({
                full_name: data.patient_name || "Bệnh nhân",
                phone_number: data.phone_number,
                email: data.email || null,
            });
        }
        patientId = patient.id;
    }

    if (!patientId) {
        throw new ApiError(400, "Cần cung cấp thông tin bệnh nhân (số điện thoại)");
    }

    const appointment = await appointmentRepository.createAppointment({
        bookable_slot_id: data.bookable_slot_id,
        patient_id: patientId,
        reason_for_visit: data.reason_for_visit || "Khám tổng quát",
        price: data.price || 0,
        payment_method: data.payment_method || "offline",
        status: "pending",
        payment_status: "pending"
    });

    await slotRepository.updateSlotStatus(
        data.bookable_slot_id,
        "booked"
    );

    // tạo thông báo
    await notificationService.createNotification(
        slot.doctor_id,
        patientId,
        "Lịch hẹn mới",
        "Có bệnh nhân vừa đặt lịch khám"
    );

    const doctor = await doctorRepository.findDoctorById(slot.doctor_id);
    const patient = await patientRepository.findPatientById(patientId);

    // HTML email
    const htmlContent = `
    <div style="font-family: Arial; padding:20px">
        <h2 style="color:#2c7be5;">Bạn có lịch hẹn khám mới</h2>

        <p>Xin chào, <b>${doctor.full_name}</b> </p>

        <p>Một bệnh nhân vừa đặt lịch khám trên hệ thống.</p>

        <table style="border-collapse: collapse; width:100%; margin-top:15px">
            <tr>
                <td style="padding:8px;border:1px solid #ddd"><b>Bệnh nhân</b></td>
                <td style="padding:8px;border:1px solid #ddd">${patient.full_name}</td>
            </tr>

            <tr>
                <td style="padding:8px;border:1px solid #ddd"><b>Mã lịch hẹn</b></td>
                <td style="padding:8px;border:1px solid #ddd">${appointment.appointment_code}</td>
            </tr>

            <tr>
                <td style="padding:8px;border:1px solid #ddd"><b>Lý do khám</b></td>
                <td style="padding:8px;border:1px solid #ddd">${data.reason_for_visit}</td>
            </tr>

            <tr>
                <td style="padding:8px;border:1px solid #ddd"><b>Giá khám</b></td>
                <td style="padding:8px;border:1px solid #ddd">${data.price} VNĐ</td>
            </tr>

            <tr>
                <td style="padding:8px;border:1px solid #ddd"><b>Phương thức thanh toán</b></td>
                <td style="padding:8px;border:1px solid #ddd">${data.payment_method}</td>
            </tr>
        </table>

        <p style="margin-top:20px">
            Vui lòng đăng nhập hệ thống để xem chi tiết lịch hẹn.
        </p>

        <p style="color:gray;font-size:13px">
            Đây là email tự động từ hệ thống đặt lịch khám.
        </p>
    </div>
    `;

    // gửi mail
    await sendMail(
        doctor.email,
        "Bạn có lịch hẹn khám mới",
        htmlContent
    );

    return appointment;
};

// Cập nhật trạng thái lịch hẹn
const updateAppointmentStatus = async (appointmentId, newStatus, doctorId) => {
    const appointment = await appointmentRepository.getAppointmentDetail(appointmentId, doctorId);

    if (!appointment) {
        throw new ApiError(404, "Không tìm thấy lịch hẹn");
    }

    const currentStatus = appointment.status;
    if (currentStatus === newStatus) {
        throw new ApiError(400, `Lịch hẹn đã ở trạng thái '${newStatus}'`);
    }

    const allowedTransitions = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["completed", "missed"],
        cancelled: [],
        completed: [],
        missed: []
    };

    if (!Object.prototype.hasOwnProperty.call(allowedTransitions, currentStatus)) {
        throw new ApiError(400, `Trạng thái hiện tại không hợp lệ: '${currentStatus}'`);
    }

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
        throw new ApiError(
            400,
            `Không thể chuyển trạng thái từ '${currentStatus}' sang '${newStatus}'`
        );
    }

    const slotInfo = appointment.BookableSlot;
    if (!slotInfo || !slotInfo.id) {
        throw new ApiError(400, "Lịch hẹn không có thông tin slot");
    }

    // Cập nhật trạng thái
    await appointmentRepository.updateAppointmentStatus(appointmentId, newStatus);

    // Slot logic
    if (newStatus === "cancelled" || newStatus === "missed") {
        await slotRepository.updateSlotStatus(slotInfo.id, "available");
    }

    // Notification
    let subject = "";
    let message = "";

    switch (newStatus) {
        case "confirmed":
            subject = "Lịch hẹn đã được xác nhận";
            message = "Bác sĩ đã xác nhận lịch hẹn của bạn";
            break;
        case "cancelled":
            subject = "Lịch hẹn đã bị hủy";
            message = "Lịch hẹn của bạn đã bị hủy";
            break;
        case "missed":
            subject = "Bạn đã bỏ lỡ lịch hẹn";
            message = "Bạn đã không đến buổi khám";
            break;
        case "completed":
            subject = "Buổi khám đã hoàn thành";
            message = "Buổi khám của bạn đã kết thúc";
            break;
    }

    if (!slotInfo.doctor_id) {
        throw new ApiError(400, "Không tìm thấy bác sĩ để tạo thông báo");
    }

    await notificationService.createNotification(
        slotInfo.doctor_id,
        appointment.patient_id,
        subject,
        message
    );

    const updatedAppointment = await appointmentRepository.getAppointmentDetail(
        appointmentId, doctorId);

    return updatedAppointment;
};

// Tra cứu lịch hẹn theo appointment_code (công khai, không cần đăng nhập)
const getAppointmentByCode = async (appointmentCode) => {
    const appointment = await appointmentRepository.findByAppointmentCode(appointmentCode);
    if (!appointment) {
        throw new ApiError(404, `Không tìm thấy lịch hẹn với mã: ${appointmentCode}`);
    }
    return appointment;
};

module.exports = {
    getAppointmentsByDoctorId,
    getAppointmentDetail,
    getAppointmentsByStatus,
    getAppointmentsByDate,
    createAppointment,
    updateAppointmentStatus,
    getAppointmentByCode
};