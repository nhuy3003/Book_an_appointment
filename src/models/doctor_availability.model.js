const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Doctor = require("../models/doctor.model");

const DoctorAvailability = sequelize.define(
  "DoctorAvailability",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    doctor_id: DataTypes.INTEGER,
    day_of_week: DataTypes.STRING,
    start_time: DataTypes.TIME,
    end_time: DataTypes.TIME,
    slot_duration_minutes: DataTypes.INTEGER,
    active: DataTypes.BOOLEAN
  },
  {
    tableName: "doctor_availability",
    timestamps: false
  }
);

// association
DoctorAvailability.belongsTo(Doctor, {
    foreignKey: "doctor_id"
});

module.exports = DoctorAvailability;