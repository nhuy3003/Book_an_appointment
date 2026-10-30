import axiosClient from './axiosClient';

const doctorApi = {
  // Lấy danh sách tất cả bác sĩ (công khai)
  // Backend: GET /api/doctor/all?specialty_id=...
  getAll: (specialtyId = null) => {
    const params = {};
    if (specialtyId) params.specialty_id = specialtyId;
    return axiosClient.get('/doctor/all', { params });
  },

  // Lấy danh sách chuyên khoa (công khai)
  // Backend: GET /api/doctor/specialties
  getSpecialties: () => {
    return axiosClient.get('/doctor/specialties');
  },

  // Lấy slot khả dụng của bác sĩ theo ngày (công khai)
  // Backend: GET /api/doctor/:id/available-slots?date=YYYY-MM-DD
  getAvailableSlots: (doctorId, date) => {
    return axiosClient.get(`/doctor/${doctorId}/available-slots`, { params: { date } });
  },

  // Lấy profile bác sĩ đang đăng nhập (cần token)
  // Backend: GET /api/doctor/profile
  getMyProfile: () => {
    return axiosClient.get('/doctor/profile');
  },

  // Cập nhật profile bác sĩ (cần token)
  // Backend: PUT /api/doctor/profile
  updateProfile: (data) => {
    return axiosClient.put('/doctor/profile', data);
  },
};

export default doctorApi;
