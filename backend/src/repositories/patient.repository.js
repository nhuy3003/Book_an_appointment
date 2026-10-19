const Patient = require("../models/patient.model");

// Lấy patient theo id
const findPatientById = async (id) => {
    return await Patient.findByPk(id);
};

// Tìm patient theo email
const findPatientByEmail = async (email) => {
    return await Patient.findOne({
        where: { email }
    });
};

// Tìm patient theo số điện thoại
const findPatientByPhone = async (phone_number) => {
    return await Patient.findOne({
        where: { phone_number }
    });
};

// Lấy tất cả patient
const findAllPatients = async () => {
    return await Patient.findAll({
        attributes: ["id", "full_name", "email", "phone_number", "address", "created_at"]
    });
};

// Tạo patient mới
const createPatient = async (data) => {
    return await Patient.create(data);
};

// Cập nhật thông tin patient
const updatePatient = async (id, data) => {
    return await Patient.update(data, {
        where: { id }
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