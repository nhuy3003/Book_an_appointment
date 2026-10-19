const BookableSlot = require("../models/bookable_slot.model");
const Doctor = require("../models/doctor.model");
const DoctorAvailability = require("../models/doctor_availability.model");
const { Op } = require("sequelize");

// Tìm slot theo id
const findSlotById = async (id) => {
    return await BookableSlot.findByPk(id, {
        include: [
            {
                model: Doctor,
                attributes: ["id", "full_name", "email", "specialty_id"]
            },
            {
                model: DoctorAvailability,
                attributes: ["id", "day_of_week", "start_time", "end_time", "slot_duration_minutes"]
            }
        ]
    });
};

// Lấy tất cả slot của một bác sĩ
const findSlotsByDoctor = async (doctor_id) => {
    return await BookableSlot.findAll({
        where: { doctor_id },
        order: [["slot_date", "ASC"], ["start_time", "ASC"]]
    });
};

// Lấy các slot khả dụng (available) của một bác sĩ theo ngày
const findAvailableSlotsByDoctorAndDate = async (doctor_id, slot_date) => {
    return await BookableSlot.findAll({
        where: {
            doctor_id,
            slot_date,
            status: "available"
        },
        attributes: ["id", "slot_date", "start_time", "end_time", "status"],
        order: [["start_time", "ASC"]]
    });
};

// Lấy slot theo khoảng ngày
const findSlotsByDoctorAndDateRange = async (doctor_id, startDate, endDate) => {
    return await BookableSlot.findAll({
        where: {
            doctor_id,
            slot_date: {
                [Op.between]: [startDate, endDate]
            }
        },
        order: [["slot_date", "ASC"], ["start_time", "ASC"]]
    });
};

// Lấy slot theo availability_id
const findSlotsByAvailability = async (availability_id) => {
    return await BookableSlot.findAll({
        where: { availability_id },
        order: [["slot_date", "ASC"], ["start_time", "ASC"]]
    });
};

// Tạo slot mới
const createSlot = async (data) => {
    return await BookableSlot.create(data);
};

// Tạo nhiều slot cùng lúc (bulk)
const createManySlots = async (slots) => {
    return await BookableSlot.bulkCreate(slots);
};

// Cập nhật slot
const updateSlot = async (id, data) => {
    return await BookableSlot.update(data, {
        where: { id }
    });
};

// Cập nhật trạng thái slot
const updateSlotStatus = async (id, status) => {
    return await BookableSlot.update(
        { status },
        { where: { id } }
    );
};

// Xóa slot theo id
const deleteSlot = async (id) => {
    return await BookableSlot.destroy({
        where: { id }
    });
};

// Xóa tất cả slot thuộc một availability
const deleteSlotsByAvailability = async (availability_id) => {
    return await BookableSlot.destroy({
        where: { availability_id }
    });
};

module.exports = {
    findSlotById,
    findSlotsByDoctor,
    findAvailableSlotsByDoctorAndDate,
    findSlotsByDoctorAndDateRange,
    findSlotsByAvailability,
    createSlot,
    createManySlots,
    updateSlot,
    updateSlotStatus,
    deleteSlot,
    deleteSlotsByAvailability
};
