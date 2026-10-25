const Patient = require("../models/patient.model");

// Lấy patient theo id
const findPatientById = async (id) => {
  return await Patient.findByPk(id);
};;

module.exports = {
    findPatientById
};