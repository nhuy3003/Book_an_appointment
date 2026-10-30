import axiosClient from './axiosClient';

const doctorAvailabilityApi = {
  // Lấy lịch làm việc của bác sĩ theo doctorId
  getByDoctorId: (doctorId) => {
    return axiosClient.get(`/doctor-availability/${doctorId}`);
  },

  // Lấy lịch làm việc theo thứ/ngày cụ thể
  getByDay: (doctorId, day) => {
    return axiosClient.get(`/doctor-availability/${doctorId}/day/${day}`);
  },

  // Tạo mới ca làm việc (Cần token)
  create: (data) => {
    return axiosClient.post('/doctor-availability', data);
  },

  // Cập nhật ca làm việc theo ID (Cần token)
  update: (idCalendar, data) => {
    return axiosClient.put(`/doctor-availability/${idCalendar}`, data);
  },

  // Xóa ca làm việc theo ID (Cần token)
  delete: (idCalendar) => {
    return axiosClient.delete(`/doctor-availability/${idCalendar}`);
  },

  // Bật/tắt hoặc vô hiệu hóa ca làm việc (Cần token)
  disable: (idCalendar) => {
    return axiosClient.patch(`/doctor-availability/${idCalendar}/disable`);
  },
};

export default doctorAvailabilityApi;

