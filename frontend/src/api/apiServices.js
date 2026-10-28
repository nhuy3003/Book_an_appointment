import axiosClient from './axiosClient';

// ==================== SPECIALTY ====================
export const specialtyApi = {
  getAll: () => axiosClient.get('/specialties'),
};

// ==================== DOCTOR ====================
export const doctorApi = {
  getAll: (params) => axiosClient.get('/doctors', { params }),
  getById: (id) => axiosClient.get(`/doctors/${id}`),
};

// ==================== BOOKABLE SLOT ====================
export const slotApi = {
  getAvailable: (doctorId, date) =>
    axiosClient.get(`/doctor-availability/slots/${doctorId}`, {
      params: { date },
    }),
};

// ==================== APPOINTMENT ====================
export const appointmentApi = {
  create: (data) => axiosClient.post('/appointments/create', data),
  lookup: (code) => axiosClient.get(`/appointments/lookup/${code}`),
  // Lấy danh sách lịch hẹn của bệnh nhân đang đăng nhập
  getMyAppointments: () => axiosClient.get('/appointments/my-appointments'),
};

// ==================== PATIENT ====================
export const patientApi = {
  findOrCreate: (data) => axiosClient.post('/patients', data),
};
