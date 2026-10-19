const Specialty = require("../models/specialty.models");

// Lấy tất cả chuyên khoa
const findAllSpecialties = async () => {
    return await Specialty.findAll({
        attributes: ["id", "specialty_name", "description"]
    });
};

// Tìm chuyên khoa theo id
const findSpecialtyById = async (id) => {
    return await Specialty.findByPk(id, {
        attributes: ["id", "specialty_name", "description"]
    });
};

// Tìm chuyên khoa theo tên
const findSpecialtyByName = async (specialty_name) => {
    return await Specialty.findOne({
        where: { specialty_name }
    });
};

// Tạo chuyên khoa mới
const createSpecialty = async (data) => {
    return await Specialty.create(data);
};

// Cập nhật chuyên khoa
const updateSpecialty = async (id, data) => {
    return await Specialty.update(data, {
        where: { id }
    });
};

// Xóa chuyên khoa
const deleteSpecialty = async (id) => {
    return await Specialty.destroy({
        where: { id }
    });
};

module.exports = {
    findAllSpecialties,
    findSpecialtyById,
    findSpecialtyByName,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty
};
