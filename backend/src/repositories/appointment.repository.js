const Appointment = require("../models/appointment.model");
const BookableSlot = require("../models/bookable_slot.model");
const Patient = require("../models/patient.model");
const { Op } = require("sequelize");

// Lấy danh sách lịch hẹn của bác sĩ
const getAppointmentsByDoctorId = async (doctorId) => {
    return await Appointment.findAll({
        attributes: ["id", "appointment_code", "status", "reason_for_visit", "price", "payment_method", "payment_status"],
        include: [
            {
                model: BookableSlot,
                attributes: ["slot_date", "start_time", "end_time"],
                where: { doctor_id: doctorId }
            },
            {
                model: Patient,
                attributes: ["id", "full_name"]
            }
        ],
        order: [
            [{ model: BookableSlot }, "slot_date", "ASC"],
            [{ model: BookableSlot }, "start_time", "ASC"]
        ]
    });
};

// Lấy chi tiết lịch hẹn theo bác sĩ
const getAppointmentDetail = async (appointmentId, doctorId) => {
    return await Appointment.findOne({
        where: { id: appointmentId },
        include: [
            {
                model: BookableSlot,
                attributes: ["id", "doctor_id", "slot_date", "start_time", "end_time"],
                where: { doctor_id: doctorId },
                required: true
            },
            {
                model: Patient,
                attributes: ["id", "full_name", "email", "phone_number"]
            }
        ]
    });
};

// Lọc lịch hẹn theo tình trạng
const getAppointmentsByStatus = async (doctorId, status) => {
    return await Appointment.findAll({
        where: { status },
        attributes: ["id", "appointment_code", "status", "reason_for_visit"],
        include: [
            {
                model: BookableSlot,
                attributes: ["slot_date", "start_time", "end_time"],
                where: { doctor_id: doctorId },
                required: true
            },
            {
                model: Patient,
                attributes: ["id", "full_name"]
            }
        ],
        order: [
            [{ model: BookableSlot }, "slot_date", "ASC"],
            [{ model: BookableSlot }, "start_time", "ASC"]
        ]
    });
};

// Lọc lịch hẹn theo ngày khám
const getAppointmentsByDate = async (doctorId, date) => {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    return await Appointment.findAll({
        attributes: ["id", "appointment_code", "status", "reason_for_visit"],
        include: [
            {
                model: BookableSlot,
                attributes: ["slot_date", "start_time", "end_time"],
                where: {
                    doctor_id: doctorId,
                    slot_date: { [Op.gte]: start, [Op.lt]: end }
                },
                required: true
            },
            {
                model: Patient,
                attributes: ["id", "full_name"]
            }
        ],
        order: [
            [{ model: BookableSlot }, "slot_date", "ASC"],
            [{ model: BookableSlot }, "start_time", "ASC"]
        ]
    });
};

// Tạo lịch hẹn mới
const createAppointment = async (data) => {
    // Tự động tạo mã appointment_code
    const lastAppointment = await Appointment.findOne({
        order: [["appointment_code", "DESC"]],
        attributes: ["appointment_code"]
    });

    let newCode = "APT001";
    if (lastAppointment && lastAppointment.appointment_code) {
        const lastNumber = parseInt(
            lastAppointment.appointment_code.replace("APT", ""), 10
        );
        const nextNumber = (lastNumber + 1).toString().padStart(3, "0");
        newCode = `APT${nextNumber}`;
    }

    return await Appointment.create({ ...data, appointment_code: newCode });
};

// Cập nhật trạng thái lịch hẹn
const updateAppointmentStatus = async (appointmentId, status) => {
    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) return null;
    appointment.status = status;
    await appointment.save();
    return appointment;
};

module.exports = {
    getAppointmentsByDoctorId,
    getAppointmentDetail,
    getAppointmentsByStatus,
    getAppointmentsByDate,
    createAppointment,
    updateAppointmentStatus
};
