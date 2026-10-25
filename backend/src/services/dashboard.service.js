const dashboardRepository = require("../repositories/dashboard.repository");

const getDashboardStats = async (doctorId) => {

  const appointments =
    await dashboardRepository.getAppointmentsByDoctor(doctorId);

  const today = new Date().toISOString().split("T")[0];

  const todayAppointments = appointments.filter(
    a => a.BookableSlot?.slot_date === today
  );

  const pending = todayAppointments.filter(
    a => a.status === "pending"
  ).length;

  const confirmed = todayAppointments.filter(
    a => a.status === "confirmed"
  ).length;

  const uniquePatients = new Set(
    todayAppointments.map(a => a.patient_id)
  ).size;

  const upcomingAppointments = todayAppointments.slice(0,5);

  const missedAppointments = todayAppointments.filter(
    a => a.status === "missed"
  );

  return {
    totalAppointmentsToday: todayAppointments.length,
    pendingAppointments: pending,
    confirmedAppointments: confirmed,
    totalUniquePatientsToday: uniquePatients,
    upcomingAppointments,
    missedAppointments
  };

};

module.exports = {
  getDashboardStats
};