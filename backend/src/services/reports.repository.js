const Appointment = require("../models/appointment.model");
const BookableSlot = require("../models/bookable_slot.model");
const { Op, fn, col, where } = require("sequelize");

// ================= PIE CHART =================
const getAppointmentStatus = async (month, year, doctorId) => {
  return await Appointment.findAll({
    attributes: [
      "status", 
      [fn("COUNT", col("Appointment.status")), "count"] 
    ],
    include: [
      {
        model: BookableSlot,
        attributes: [],
        where: {
          doctor_id: doctorId
        }
      }
    ],
    where: {
      [Op.and]: [
        where(fn("MONTH", col("Appointment.created_at")), month),
        where(fn("YEAR", col("Appointment.created_at")), year)
      ]
    },

    group: ["Appointment.status"], 
    raw: true
  });
};

// ================= BAR + LINE CHART =================
const getRevenueByYear = async (year, doctorId) => {
  return await Appointment.findAll({
    attributes: [
      [fn("MONTH", col("Appointment.created_at")), "month"],
      [fn("COUNT", col("Appointment.id")), "appointments"],
      [fn("SUM", col("Appointment.price")), "revenue"]
    ],
    include: [
      {
        model: BookableSlot,
        attributes: [],
        where: {
          doctor_id: doctorId
        }
      }
    ],
    where: where(fn("YEAR", col("Appointment.created_at")), year),
    group: [fn("MONTH", col("Appointment.created_at"))],
    order: [[fn("MONTH", col("Appointment.created_at")), "ASC"]],
    raw: true
  });
};

// ================= TABLE + TOTAL =================
const getAppointmentsByDateRange = async (fromDate, toDate, doctorId) => {
  const appointments = await Appointment.findAll({
    where: {

      "$Appointment.created_at$": {
        [Op.between]: [fromDate, toDate]
      }
    },
    include: [
      {
        model: BookableSlot,
        attributes: [],
        where: {
          doctor_id: doctorId
        }
      }
    ],
    attributes: [
      "appointment_code",
      "patient_id",
      "status",
      "price",
      "created_at"
    ],
    order: [["created_at", "ASC"]],
    raw: true
  });

  const total = await Appointment.findOne({
    attributes: [
      [fn("SUM", col("Appointment.price")), "totalRevenue"]
    ],
    include: [
      {
        model: BookableSlot,
        attributes: [],
        where: {
          doctor_id: doctorId
        }
      }
    ],
    where: {
      "$Appointment.created_at$": {
        [Op.between]: [fromDate, toDate]
      }
    },
    raw: true
  });

  return {
    appointments,
    totalRevenue: Number(total?.totalRevenue) || 0
  };
};

module.exports = {
  getAppointmentStatus,
  getRevenueByYear,
  getAppointmentsByDateRange
};