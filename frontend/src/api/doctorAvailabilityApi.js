import axiosClient from './axiosClient';

const doctorAvailabilityApi = {
  getByDoctorId: (doctorId) => {
    return axiosClient.get(`/doctor-availability/${doctorId}`);
  },

  getByDay: (doctorId, day) => {
    return axiosClient.get(`/doctor-availability/${doctorId}/day/${day}`);
  },

  getMyTemplates: () => {
    return axiosClient.get('/doctor-availability/me/templates');
  },

  getMySlots: (from, to) => {
    return axiosClient.get('/doctor-availability/me/slots', { params: { from, to } });
  },

  bulkCreate: (data) => {
    return axiosClient.post('/doctor-availability/bulk', data);
  },

  generateSlots: (from, to) => {
    return axiosClient.post('/doctor-availability/generate-slots', { from, to });
  },

  setDayOff: (date, off) => {
    return axiosClient.patch('/doctor-availability/day-off', { date, off });
  },

  setSlotStatus: (slotId, status) => {
    return axiosClient.patch(`/doctor-availability/slots/${slotId}/status`, { status });
  },

  create: (data) => {
    return axiosClient.post('/doctor-availability', data);
  },

  update: (idCalendar, data) => {
    return axiosClient.put(`/doctor-availability/${idCalendar}`, data);
  },

  delete: (idCalendar) => {
    return axiosClient.delete(`/doctor-availability/${idCalendar}`);
  },

  disable: (idCalendar) => {
    return axiosClient.patch(`/doctor-availability/${idCalendar}/disable`);
  },
};

export default doctorAvailabilityApi;

