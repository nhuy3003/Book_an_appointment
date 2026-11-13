const { Doctor, Specialty } = require("../models/index");
const { Op, where } = require("sequelize")

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

// Lấy tất cả bác sĩ (kèm chuyên khoa) - API công khai cho bệnh nhân
const findAllDoctors = async (specialtyId = null) => {
    const where = {};
    if (specialtyId) where.specialty_id = specialtyId;
    return await Doctor.findAll({
        where,
        attributes: [
            "id", "full_name", "phone_number",
            "image_url", "experience_years", "price_per_appointment", "bio"
        ],
        include: [
            {
                model: Specialty,
                attributes: ["id", "specialty_name"]
            }
        ],
        order: [["full_name", "ASC"]]
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

const searchDoctor = async (keyword, maxPrice, currentDoctorId = "", blockList = []) => {
    const whereConditions = [];

    if (keyword)
    {
        whereConditions.push({
            [Op.or]: [
                {full_name: {[Op.like]: `%${keyword}%`}},
                {bio: {[Op.like]: `%${keyword}%`}},
            ]
        });
    }

    if (maxPrice)
    {
        whereConditions.push({
            price_per_appointment: {[Op.lte]: Number(maxPrice)}
        });
    }

    if (currentDoctorId)
    {
        whereConditions.push({
            id: {[Op.ne]: currentDoctorId} 
        });
    }

    if (blockList && blockList.length > 0)
    {
        whereConditions.push({
            id: {[Op.notIn]: blockList}
        });
    }

    return await Doctor.findAll({
        where: {
            [Op.and]: whereConditions
        },
        attributes: ["id", "full_name", "email", "phone_number", "price_per_appointment", "bio"],
        include: [{
            model: Specialty, 
            attributes: 
                ["id", "specialty_name"]}]
    });
}

module.exports = {
    findByEmail,
    findDoctorById,
    findAllDoctors,
    updatePassword,
    updateDoctor,
    searchDoctor
};
