const { Doctor, Specialty } = require("../models/index");

// Tìm bác sĩ theo email
const findByEmail = async (email) => {
    return await Doctor.findOne({ where: { email } });
};

// Tìm bác sĩ theo ID (kèm chuyên khoa)
const findDoctorById = async (id) => {
    return await Doctor.findByPk(id, {
        attributes: [
            "id", "full_name", "email", "phone_number",
            "address", "specialty_id", "image_url",
            "experience_years", "price_per_appointment", "bio"
        ],
        include: [
            {
                model: Specialty,
                attributes: ["id", "specialty_name"]
            }
        ]
    });
};

// Cập nhật mật khẩu
const updatePassword = async (id, password) => {
    return await Doctor.update({ password }, { where: { id } });
};

// Cập nhật thông tin bác sĩ (dùng trong updateProfile service)
const updateDoctor = async (id, data) => {
    return await Doctor.update(data, { where: { id } });
};

module.exports = {
    findByEmail,
    findDoctorById,
    updatePassword,
    updateDoctor
};
