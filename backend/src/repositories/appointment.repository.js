const Appointment = require("../models/appointment.model");
const BookableSlot = require("../models/bookable_slot.model");
const Patient = require("../models/patient.model");

// Tìm lịch hẹn theo id
const findAppointmentById = async (id) => {
    return await Appointment.findByPk(id, {
        include: [
            {
                model: BookableSlot,
                attributes: ["id", "doctor_id", "slot_date", "start_time", "end_time", "status"]
            },
            {
                model: Patient,
                attributes: ["id", "full_name", "email", "phone_number"]
            }
        ]
    });
};

// Tìm lịch hẹn theo mã appointment_code
const findByAppointmentCode = async (appointment_code) => {
    return await Appointment.findOne({
        where: { appointment_code },
        include: [
            {
                model: BookableSlot,
                attributes: ["id", "doctor_id", "slot_date", "start_time", "end_time"]
            },
            {
                model: Patient,
                attributes: ["id", "full_name", "email", "phone_number"]
            }
        ]
    });
};

// Lấy tất cả lịch hẹn theo patient_id
const findAppointmentsByPatient = async (patient_id) => {
    return await Appointment.findAll({
        where: { patient_id },
        include: [
            {
                model: BookableSlot,
                attributes: ["id", "doctor_id", "slot_date", "start_time", "end_time"]
            }
        ],
        order: [["created_at", "DESC"]]
    });
};

// Lấy tất cả lịch hẹn theo bookable_slot_id
const findAppointmentsBySlot = async (bookable_slot_id) => {
    return await Appointment.findAll({
        where: { bookable_slot_id },
        include: [
            {
                model: Patient,
                attributes: ["id", "full_name", "email", "phone_number"]
            }
        ]
    });
};

// Lấy tất cả lịch hẹn theo status
const findAppointmentsByStatus = async (status) => {
    return await Appointment.findAll({
        where: { status },
        include: [
            {
                model: BookableSlot,
                attributes: ["id", "doctor_id", "slot_date", "start_time", "end_time"]
            },
            {
                model: Patient,
                attributes: ["id", "full_name", "email", "phone_number"]
            }
        ],
        order: [["created_at", "DESC"]]
    });
};

// Tạo lịch hẹn mới
const createAppointment = async (data) => {
    return await Appointment.create(data);
};

// Cập nhật lịch hẹn
const updateAppointment = async (id, data) => {
    return await Appointment.update(data, {
        where: { id }
    });
};

// Cập nhật trạng thái lịch hẹn
const updateAppointmentStatus = async (id, status) => {
    return await Appointment.update(
        { status },
        { where: { id } }
    );
};

// Cập nhật trạng thái thanh toán
const updatePaymentStatus = async (id, payment_status) => {
    return await Appointment.update(
        { payment_status },
        { where: { id } }
    );
};

// Xóa lịch hẹn
const deleteAppointment = async (id) => {
    return await Appointment.destroy({
        where: { id }
    });
};

module.exports = {
    findAppointmentById,
    findByAppointmentCode,
    findAppointmentsByPatient,
    findAppointmentsBySlot,
    findAppointmentsByStatus,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    updatePaymentStatus,
    deleteAppointment
};
