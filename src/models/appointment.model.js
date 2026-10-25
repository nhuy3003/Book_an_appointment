const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); 
const BookableSlot = require("../models/bookable_slot.model");
const Patient = require("../models/patient.model");

const Appointment = sequelize.define(
  "Appointment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    appointment_code: DataTypes.STRING,
    patient_id: DataTypes.INTEGER,
    bookable_slot_id: DataTypes.INTEGER,
    status: DataTypes.STRING,
    reason_for_visit: DataTypes.STRING,
    note: DataTypes.STRING,
    price: DataTypes.INTEGER,
    payment_method: DataTypes.STRING,
    payment_status: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  },
  {
    tableName: "appointment",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

// association
Appointment.belongsTo(BookableSlot, {
  foreignKey: "bookable_slot_id"
});

Appointment.belongsTo(Patient, {
  foreignKey: "patient_id"
});

module.exports = Appointment;