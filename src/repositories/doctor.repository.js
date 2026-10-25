const { Doctor, Specialty } = require("../models");

const findByEmail = async (email) => {
  const doctor = await Doctor.findOne({
    where: { email }
  });

  return doctor;
};

const findDoctorById = async (id) => {

  const doctor = await Doctor.findByPk(id, {
    attributes: [
      "id",
      "full_name",
      "email",
      "password",
      "phone_number",
      "address",
      "image_url",
      "experience_years",
      "bio"
    ],
    include: [
      {
        model: Specialty,
        attributes: ["specialty_name"]
      }
    ],
  });

  return doctor;
};
const updatePassword = async (id, password) => {

  const doctor = await Doctor.update(
    { password },
    {
      where: { id }
    }
  );

  return doctor;
};
const updateDoctor = async (id, data) => {
  return await Doctor.update(data, {
    where: { id }
  });
};
module.exports = {
  findByEmail,
  findDoctorById,
  updatePassword,
  updateDoctor
};