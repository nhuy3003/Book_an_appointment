const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); 
const Doctor = require("../models/doctor.model");
const DoctorAvailability = require("../models/doctor_availability.model");

const BookableSlot = sequelize.define("BookableSlot", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    doctor_id: DataTypes.INTEGER,
    slot_date: DataTypes.DATE,
    start_time: DataTypes.TIME,
    end_time: DataTypes.TIME,
    status: DataTypes.STRING,
    availability_id: DataTypes.INTEGER,
},
    {
        tableName: "bookable_slot",
        timestamps: false
    }
);

// association
BookableSlot.belongsTo(Doctor, {
    foreignKey: "doctor_id"
  });
  
  BookableSlot.belongsTo(DoctorAvailability, {
    foreignKey: "availability_id"
  });
  
  module.exports = BookableSlot;