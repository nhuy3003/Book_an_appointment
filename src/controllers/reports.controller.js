const {
    getStatusStatsService,
    getRevenueStatsService,
    getAppointmentsService
  } = require("../services/reports.service");
  
  // GET /appointment-status
  const getAppointmentStatusStats = async (req, res) => {
    try {
      const { month, year } = req.query;
  
      const doctorId = req.user.id; // 
  
      const data = await getStatusStatsService(
        parseInt(month),
        parseInt(year),
        doctorId
      );
  
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  // GET /revenue
  const getRevenueStats = async (req, res) => {
    try {
      const { year } = req.query;
  
      const doctorId = req.user.id; 
  
      const data = await getRevenueStatsService(
        parseInt(year),
        doctorId
      );
  
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  };
  
  // GET /appointments
  const getAppointments = async (req, res, next) => {
    try {
      const { fromDate, toDate } = req.query;
  
      const doctorId = req.user.id; 
  
      if (!fromDate || !toDate) {
        return res.status(400).json({
          message: "Thiếu fromDate hoặc toDate"
        });
      }
  
      const data = await getAppointmentsService(
        fromDate,
        toDate,
        doctorId
      );
  
      res.json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  };
  
  module.exports = {
    getAppointmentStatusStats,
    getRevenueStats,
    getAppointments
  };