const Doctor = require("./doctor.model");
const Specialty = require("./specialty.model");


Doctor.belongsTo(Specialty, {
  foreignKey: "specialty_id"
});

Specialty.hasMany(Doctor, {
  foreignKey: "specialty_id"
});

module.exports = {
  Doctor,
  Specialty
};