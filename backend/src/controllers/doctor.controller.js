const doctorService = require("../services/doctor.service");
const response = require("../utils/response");

// Lấy tất cả bác sĩ (công khai - dành cho bệnh nhân)
const getAllDoctors = async (req, res, next) => {
  try {
    const { specialty_id, date } = req.query;
    const doctors = await doctorService.getAllDoctors(specialty_id || null, date || null);
    return response.success(res, doctors, "Lấy danh sách bác sĩ thành công");
  } catch (error) {
    next(error);
  }
};

// Lấy tất cả chuyên khoa (công khai)
const getAllSpecialties = async (req, res, next) => {
  try {
    const specialties = await doctorService.getAllSpecialties();
    return response.success(res, specialties, "Lấy danh sách chuyên khoa thành công");
  } catch (error) {
    next(error);
  }
};

// Lấy slot khả dụng của bác sĩ theo ngày (công khai)
const getAvailableSlots = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: "Thiếu tham số date (YYYY-MM-DD)" });
    }
    const slots = await doctorService.getAvailableSlots(id, date);
    return response.success(res, slots, "Lấy slot khả dụng thành công");
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách ngày còn slot trống của bác sĩ (công khai)
const getAvailableDates = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;
    const dates = await doctorService.getAvailableDates(id, from, to);
    return response.success(res, dates, "Lấy danh sách ngày còn trống thành công");
  } catch (error) {
    next(error);
  }
};

// Lấy profile bác sĩ đang đăng nhập
const getDoctorById = async (req, res, next) => {
    try {
        const doctorId = req.user.id;
        const doctor = await doctorService.getDoctorById(doctorId);
        return response.success(res, doctor, "Lấy thông tin bác sĩ thành công");
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = req.body;
    await doctorService.updateProfile(userId, data);
    res.json({ success: true, message: "Cập nhật thành công" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
    getDoctorById,
    updateProfile,
    getAllDoctors,
    getAllSpecialties,
    getAvailableSlots,
    getAvailableDates
};