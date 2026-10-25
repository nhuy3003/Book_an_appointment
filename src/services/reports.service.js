const {
    getAppointmentStatus,
    getRevenueByYear,
    getAppointmentsByDateRange
  } = require("../repositories/reports.repository");
  
  // PIE
  const getStatusStatsService = async (month, year, doctorId) => {
    return await getAppointmentStatus(month, year, doctorId);
  };
  
  // BAR + LINE
  const getRevenueStatsService = async (year, doctorId) => {
    return await getRevenueByYear(year, doctorId);
  };
  
  // TABLE
  const getAppointmentsService = async (fromDate, toDate, doctorId) => {
    return await getAppointmentsByDateRange(fromDate, toDate, doctorId);
  };
  
  module.exports = {
    getStatusStatsService,
    getRevenueStatsService,
    getAppointmentsService
  };