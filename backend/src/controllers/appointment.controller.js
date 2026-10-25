const appointmentService = require("../services/appointment.service");
const response = require("../utils/response");

// Lấy danh sách lịch hẹn của bác sĩ
const getAppointmentsByDoctorId = async (req, res, next) => {
  try {
    const doctorId = req.user.id; // lấy id bác sĩ đang đăng nhập từ token

    const appointments = await appointmentService.getAppointmentsByDoctorId(doctorId);

    return response.success(
      res,
      appointments,
      "Lấy lịch hẹn thành công"
    );
  } catch (error) {
    next(error); // chuyển lỗi sang errorHandler
  }
};

// Lấy chi tiết lịch hẹn
const getAppointmentDetail = async (req, res, next) => {

  try {
    const appointmentId = req.params.id;
    // Lấy ID bác sĩ từ user đang đăng nhập (thông qua middleware verifyToken)
    const doctorId = req.user.id; 

    const appointment =
      await appointmentService.getAppointmentDetail(appointmentId, doctorId);

    return response.success(
      res,
      appointment,
      "Lấy chi tiết lịch hẹn thành công"
    );

  } catch (error) {
    next(error);
  }

};

// Lọc lịch hẹn theo tình trạng
const getAppointmentsByStatus = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const status = req.params.status;

    const appointments = await appointmentService.getAppointmentsByStatus(doctorId, status);

    return response.success(
      res,
      appointments,
      "Lọc lịch hẹn theo tình trạng thành công"
    );
  } catch (error) {
    next(error);
  }
};

// Lọc lịch hẹn theo ngày khám
const getAppointmentsByDate = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const date = req.params.date;

    const appointments = await appointmentService.getAppointmentsByDate(doctorId, date);

    return response.success(
      res,
      appointments,
      "Lọc lịch hẹn theo ngày khám thành công"
    );
  } catch (error) {
    next(error);
  }
};

// Tạo lịch hẹn
const createAppointment = async (req, res, next) => {

  try {

    const data = req.body;

    const appointment =
      await appointmentService.createAppointment(data);

    return res.status(201).json({
      success: true,
      message: "Đặt lịch khám thành công",
      data: appointment
    });

  } catch (error) {
    next(error);
  }

};

// Cập nhật trạng thái lịch hẹn
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const doctorId = req.user?.id;

    if (!doctorId) {
      return res.status(401).json({ message: "Doctor ID không hợp lệ" });
    }

    const updatedAppointment = await appointmentService.updateAppointmentStatus(
      id,
      status,
      doctorId
    );

    return response.success(
      res,
      updatedAppointment,
      "Cập nhật trạng thái lịch hẹn thành công"
    );
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getAppointmentsByDoctorId,
  getAppointmentDetail,
  getAppointmentsByStatus,
  getAppointmentsByDate,
  createAppointment,
  updateAppointmentStatus
};

