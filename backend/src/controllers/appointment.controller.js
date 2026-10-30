const appointmentService = require("../services/appointment.service");
const response = require("../utils/response");

// Lấy danh sách lịch hẹn của bác sĩ (hỗ trợ filter qua query: ?status=&date=)
const getAppointmentsByDoctorId = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const { status, date } = req.query;

    let appointments;
    if (status && status !== 'all') {
      appointments = await appointmentService.getAppointmentsByStatus(doctorId, status);
    } else if (date) {
      appointments = await appointmentService.getAppointmentsByDate(doctorId, date);
    } else {
      appointments = await appointmentService.getAppointmentsByDoctorId(doctorId);
    }

    return response.success(
      res,
      appointments,
      "Lấy lịch hẹn thành công"
    );
  } catch (error) {
    // Nếu không tìm thấy, trả về mảng trống thay vì 404
    if (error.statusCode === 404) {
      return response.success(res, [], "Không có lịch hẹn nào");
    }
    next(error);
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

// Tra cứu lịch hẹn theo appointment_code (công khai, không cần đăng nhập)
const getAppointmentByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const appointment = await appointmentService.getAppointmentByCode(code);
    return response.success(res, appointment, "Tra cứu lịch hẹn thành công");
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
  getAppointmentByCode
};

