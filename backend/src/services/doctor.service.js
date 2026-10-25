const doctorRepository = require("../repositories/doctor.repository");
const ApiError = require("../utils/ApiError");

const getDoctorById = async (doctorId) => {

  const doctor = await doctorRepository.findDoctorById(doctorId);

  if (!doctor) {
    throw new ApiError(404, "Không tìm thấy bác sĩ");
  }
  const result = {
    ...doctor.toJSON(),
    specialty: doctor.Specialty?.specialty_name,
  };
  
  delete result.Specialty;
  delete result.password

  return result;

};

const updateProfile = async (doctorId, data) => {
  const allowedFields = [
    "full_name",
    "phone_number",
    "address",
    "image_url",
    "experience_years",
    "bio"
  ];

  const filteredData = {};

  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      filteredData[field] = data[field];
    }
  });

  if (Object.keys(filteredData).length === 0) {
    throw new Error("Không có dữ liệu hợp lệ để cập nhật");
  }

  await doctorRepository.updateDoctor(doctorId, filteredData);
};

module.exports = {
  getDoctorById,
  updateProfile
};