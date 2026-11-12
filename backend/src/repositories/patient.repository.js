const Patient = require("../models/patient.model");

// Lấy patient theo id
const findPatientById = async (id, transaction = null) => {
    return await Patient.findByPk(id, { transaction });
};

// Tìm patient theo email
const findPatientByEmail = async (email) => {
    return await Patient.findOne({
        where: { email }
    });
};

// Tìm patient theo số điện thoại
const findPatientByPhone = async (phone_number, transaction = null) => {
    return await Patient.findOne({
        where: { phone_number },
        transaction
    });
};

// Lấy tất cả patient
const findAllPatients = async () => {
    return await Patient.findAll({
        attributes: ["id", "full_name", "email", "phone_number", "address", "created_at"]
    });
};

// Tạo patient mới
const createPatient = async (data, transaction = null) => {
    return await Patient.create(data, { transaction });
};

// Cập nhật thông tin patient
const updatePatient = async (id, data, transaction = null) => {
    return await Patient.update(data, {
        where: { id },
        transaction
    });
};

// Xóa patient
const deletePatient = async (id) => {
    return await Patient.destroy({
        where: { id }
    });
};

module.exports = {
    findPatientById,
    findPatientByEmail,
    findPatientByPhone,
    findAllPatients,
    createPatient,
    updatePatient,
    deletePatient
};