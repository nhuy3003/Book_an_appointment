import axiosClient from './axiosClient';

const appointmentApi = {
  // Bác sĩ lấy danh sách lịch hẹn của mình (có hỗ trợ filter: { status, date })
  getDoctorAppointments: (params = {}) => {
    return axiosClient.get('/appointments/my-appointments', { params });
  },

  // Bác sĩ cập nhật trạng thái lịch hẹn hoặc ghi chú
  updateAppointment: (id, data) => {
    return axiosClient.patch(`/appointments/${id}`, data);
  },
};

export default appointmentApi;

