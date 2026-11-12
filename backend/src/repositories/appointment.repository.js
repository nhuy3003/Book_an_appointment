const Appointment = require("../models/appointment.model");
const BookableSlot = require("../models/bookable_slot.model");
const Patient = require("../models/patient.model");
const Doctor = require("../models/doctor.model");
const Specialty = require("../models/specialty.models");
const { Op } = require("sequelize");
const { ACTIVE_STATUSES } = require("../constants/appointment.constants");

const PATIENT_FIELDS = ["id", "full_name", "phone_number", "email", "address"];

const LIST_ATTRIBUTES = [
    "id",
    "appointment_code",
    "status",
    "reason_for_visit",
    "note",
    "price",
    "payment_method",
    "payment_status",
    "created_at"
];

const buildDoctorSlotInclude = (doctorId, extraWhere = {}, options = {}) => ({
    model: BookableSlot,
    attributes: ["id", "doctor_id", "slot_date", "start_time", "end_time", "status"],
    where: { doctor_id: doctorId, ...extraWhere },
    required: true,
    ...(options.lock && options.transaction
        ? { lock: options.transaction.LOCK.UPDATE }
        : {})
});

const patientInclude = {
    model: Patient,
    attributes: PATIENT_FIELDS
};

const buildDateWhere = (date) => {
    if (!date) return {};
    return { slot_date: date };
};

const listAppointmentsByDoctor = async ({
    doctorId,
    status,
    date,
    page,
    limit,
    transaction = null
}) => {
    const where = {};
    if (status && status !== "all") where.status = status;

    const { count, rows } = await Appointment.findAndCountAll({
        where,
        attributes: LIST_ATTRIBUTES,
        include: [
            buildDoctorSlotInclude(doctorId, buildDateWhere(date)),
            patientInclude
        ],
        order: [
            [{ model: BookableSlot }, "slot_date", "ASC"],
            [{ model: BookableSlot }, "start_time", "ASC"]
        ],
        distinct: true,
        limit,
        offset: (page - 1) * limit,
        transaction
    });

    return { rows, count };
};

const getAppointmentsByDoctorId = async (doctorId) => {
    const { rows } = await listAppointmentsByDoctor({
        doctorId,
        page: 1,
        limit: 10000
    });
    return rows;
};

const findAppointmentById = async (appointmentId, options = {}) => {
    return await Appointment.findOne({
        where: { id: appointmentId },
        include: [
            {
                model: BookableSlot,
                attributes: ["id", "doctor_id", "slot_date", "start_time", "end_time", "status"],
                required: true
            },
            patientInclude
        ],
        transaction: options.transaction,
        lock: options.lock && options.transaction
            ? options.transaction.LOCK.UPDATE
            : undefined
    });
};

const getAppointmentDetail = async (appointmentId, doctorId, options = {}) => {
    return await Appointment.findOne({
        where: { id: appointmentId },
        include: [
            buildDoctorSlotInclude(doctorId, {}, options),
            patientInclude
        ],
        transaction: options.transaction
    });
};

const getAppointmentsByStatus = async (doctorId, status) => {
    const { rows } = await listAppointmentsByDoctor({
        doctorId,
        status,
        page: 1,
        limit: 10000
    });
    return rows;
};

const getAppointmentsByDate = async (doctorId, date) => {
    const { rows } = await listAppointmentsByDoctor({
        doctorId,
        date,
        page: 1,
        limit: 10000
    });
    return rows;
};

const getActiveAppointmentsByDoctorAndDate = async (doctorId, date) => {
    return await Appointment.findAll({
        where: { status: { [Op.in]: ACTIVE_STATUSES } },
        attributes: ["id", "appointment_code", "status", "reason_for_visit"],
        include: [
            buildDoctorSlotInclude(doctorId, { slot_date: date }),
            patientInclude
        ],
        order: [[{ model: BookableSlot }, "start_time", "ASC"]]
    });
};

const createAppointment = async (data, transaction = null) => {
    const appointment = await Appointment.create(
        { ...data, appointment_code: data.appointment_code || `TMP${Date.now()}` },
        { transaction }
    );
    const code = `APT${String(appointment.id).padStart(3, "0")}`;
    await appointment.update({ appointment_code: code }, { transaction });
    return appointment;
};

const updateAppointmentStatus = async (appointmentId, status, transaction = null) => {
    const appointment = await Appointment.findByPk(appointmentId, { transaction });
    if (!appointment) return null;
    appointment.status = status;
    await appointment.save({ transaction });
    return appointment;
};

const findByAppointmentCode = async (appointmentCode, options = {}) => {
    return await Appointment.findOne({
        where: { appointment_code: appointmentCode },
        attributes: [
            "id",
            "appointment_code",
            "status",
            "reason_for_visit",
            "price",
            "payment_method",
            "payment_status",
            "patient_id"
        ],
        include: [
            {
                model: BookableSlot,
                attributes: ["id", "slot_date", "start_time", "end_time", "doctor_id", "status"],
                include: [
                    {
                        model: Doctor,
                        attributes: ["id", "full_name", "phone_number"],
                        include: [
                            {
                                model: Specialty,
                                attributes: ["id", "specialty_name"]
                            }
                        ]
                    }
                ]
            },
            {
                model: Patient,
                attributes: PATIENT_FIELDS
            }
        ],
        transaction: options.transaction,
        lock: options.lock && options.transaction
            ? options.transaction.LOCK.UPDATE
            : undefined
    });
};

module.exports = {
    listAppointmentsByDoctor,
    getAppointmentsByDoctorId,
    findAppointmentById,
    getAppointmentDetail,
    getAppointmentsByStatus,
    getAppointmentsByDate,
    getActiveAppointmentsByDoctorAndDate,
    createAppointment,
    updateAppointmentStatus,
    findByAppointmentCode
};
