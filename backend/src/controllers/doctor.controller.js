const doctorService = require("../services/doctor.service");
const response = require("../utils/response");

const getDoctorById = async (req, res, next) => {

    try {

        const doctorId = req.user.id;

        const doctor = await doctorService.getDoctorById(doctorId);

        return response.success(
            res,
            doctor,
            "Lấy thông tin bác sĩ thành công"
        );
    } catch (error) {
        next (error);
    }

};

  const updateProfile = async (req, res, next) => {
    try {
      const userId = req.user.id;
  
      const data = req.body;
  
      await doctorService.updateProfile(userId, data);
  
      res.json({
        success: true,
        message: "Cập nhật thành công"
      });
  
    } catch (error) {
      next(error);
    }
  };

module.exports = {
    getDoctorById,
    updateProfile
};