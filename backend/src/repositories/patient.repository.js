const Patient = require("../models/patient.model");

// Lay patient theo id
const findPatientById = async (id) => {
    return await Patient.findByPk (id);
};;

module.exports = {
    findPatientById,
};