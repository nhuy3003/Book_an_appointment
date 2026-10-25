const Doctor = require("./doctor.model");
const Specialty = require("./specialty.models");
const DoctorAvailability = require("./doctor_availability.model");
const BookableSlot = require("./bookable_slot.model");
const Patient = require("./patient.model");
const Appointment = require("./appointment.model");
const Notification = require("./notification.model");

// Doctor <-> Specialty
Doctor.belongsTo(Specialty, { foreignKey: "specialty_id" });
Specialty.hasMany(Doctor, { foreignKey: "specialty_id" });

// DoctorAvailability <-> Doctor
DoctorAvailability.belongsTo(Doctor, { foreignKey: "doctor_id" });
Doctor.hasMany(DoctorAvailability, { foreignKey: "doctor_id" });

// BookableSlot <-> Doctor
BookableSlot.belongsTo(Doctor, { foreignKey: "doctor_id" });
Doctor.hasMany(BookableSlot, { foreignKey: "doctor_id" });

// BookableSlot <-> DoctorAvailability
BookableSlot.belongsTo(DoctorAvailability, { foreignKey: "availability_id" });
DoctorAvailability.hasMany(BookableSlot, { foreignKey: "availability_id" });

// Appointment <-> BookableSlot
Appointment.belongsTo(BookableSlot, { foreignKey: "bookable_slot_id" });
BookableSlot.hasMany(Appointment, { foreignKey: "bookable_slot_id" });

// Appointment <-> Patient
Appointment.belongsTo(Patient, { foreignKey: "patient_id" });
Patient.hasMany(Appointment, { foreignKey: "patient_id" });

// Notification <-> Doctor & Patient  (doctor_id, patient_id theo DB)
Notification.belongsTo(Doctor, { foreignKey: "doctor_id" });
Notification.belongsTo(Patient, { foreignKey: "patient_id" });

module.exports = {
    Doctor,
    Specialty,
    DoctorAvailability,
    BookableSlot,
    Patient,
    Appointment,
    Notification
};