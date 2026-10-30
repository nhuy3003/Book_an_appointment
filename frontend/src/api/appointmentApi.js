import axiosClient from './axiosClient';

const appointmentApi = {
  // Bác sĩ lấy danh sách lịch hẹn (hỗ trợ filter: { status, date })
  // Backend: GET /api/appointments?status=...&date=...
  getDoctorAppointments: (params = {}) => {
    // Lọc ra tham số undefined hoặc 'all' để tránh gửi lên backend
    const cleanParams = {};
    if (params.status && params.status !== 'all') cleanParams.status = params.status;
    if (params.date) cleanParams.date = params.date;
    return axiosClient.get('/appointments', { params: cleanParams });
  },

  // Bác sĩ cập nhật trạng thái lịch hẹn
  // Backend: PATCH /api/appointments/:id/status  { status: "confirmed" }
  updateAppointment: (id, data) => {
    if (data.status !== undefined) {
      return axiosClient.patch(`/appointments/${id}/status`, { status: data.status });
    }
    return axiosClient.patch(`/appointments/${id}/status`, data);
  },

  // Tra cứu lịch hẹn theo mã code (không cần đăng nhập)
  // Backend: GET /api/appointments/code/:code
  getByCode: (code) => {
    return axiosClient.get(`/appointments/code/${code}`);
  },

  // Đặt lịch hẹn mới (không cần đăng nhập - dành cho bệnh nhân)
  // Backend: POST /api/appointments/create
  createAppointment: (data) => {
    return axiosClient.post('/appointments/create', data);
  },
};

export default appointmentApi;
