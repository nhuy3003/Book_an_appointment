const Appointment = require("../models/appointment.model");
const BookableSlot = require("../models/bookable_slot.model");
const Patient = require("../models/patient.model");

const getAppointmentsByDoctor = async (doctorId) => {

  return await Appointment.findAll({
    attributes: ["id", "status", "patient_id"],
    include: [
      {
        model: BookableSlot,
        attributes: ["slot_date", "start_time", "end_time"],
        where: {
          doctor_id: doctorId
        }
      },
      {
        model: Patient,
        attributes: ["id", "full_name"]
      }
    ],
    order: [
      [{ model: BookableSlot }, "slot_date", "ASC"],
      [{ model: BookableSlot }, "start_time", "ASC"]
    ]
  });

};

module.exports = {
  getAppointmentsByDoctor
};