const appointmentService = require("../services/appointment.service");
const response = require("../utils/response");

const getAppointmentsByDoctorId = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const result = await appointmentService.listAppointments(doctorId, req.query);
    return response.success(res, result, "Lấy lịch hẹn thành công");
  } catch (error) {
    next(error);
  }
};

const getAppointmentDetail = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const doctorId = req.user.id;
    const appointment = await appointmentService.getAppointmentDetail(appointmentId, doctorId);
    return response.success(res, appointment, "Lấy chi tiết lịch hẹn thành công");
  } catch (error) {
    next(error);
  }
};

const getAppointmentsByStatus = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const status = req.params.status;
    const appointments = await appointmentService.getAppointmentsByStatus(doctorId, status);
    return response.success(res, appointments, "Lọc lịch hẹn theo tình trạng thành công");
  } catch (error) {
    next(error);
  }
};

const getAppointmentsByDate = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const date = req.params.date;
    const appointments = await appointmentService.getAppointmentsByDate(doctorId, date);
    return response.success(res, appointments, "Lọc lịch hẹn theo ngày khám thành công");
  } catch (error) {
    next(error);
  }
};

const createAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.createAppointment(req.body);
    return res.status(201).json({
      success: true,
      message: "Đặt lịch khám thành công",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

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

const getAppointmentByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const appointment = await appointmentService.getAppointmentByCode(code);
    return response.success(res, appointment, "Tra cứu lịch hẹn thành công");
  } catch (error) {
    next(error);
  }
};

const cancelAppointmentByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const appointment = await appointmentService.cancelAppointmentByCode(
      code,
      req.body.phone_number
    );
    return response.success(res, appointment, "Hủy lịch hẹn thành công, khung giờ đã được mở lại");
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
  updateAppointmentStatus,
  getAppointmentByCode,
  cancelAppointmentByCode,
};
