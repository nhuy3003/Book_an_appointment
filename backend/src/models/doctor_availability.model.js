const { DataTypes } = require('sequelize');
const sequelize = require("../config/database");
const Doctor = require("./doctor.model");

 const DoctorAvailability = sequelize.define(
    "DoctorAvailability",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        doctor_id: DataTypes.INTEGER,
        day_of_week: DataTypes.STRING,
        start_time: DataTypes.TIME,
        end_time: DataTypes.TIME,
        slot_duration_minutes: DataTypes.INTEGER,
        active: DataTypes.BOOLEAN,
    },
    {
        tableName: "doctor_availability",
        timestamps: false
    }
 );

 // association with Doctor model (ket hop 1-n)
 // khai bao 1 lich lam viec thuoc ve 1 bac si cu the
 DoctorAvailability.belongsTo(Doctor, { // nho belongsTo nen moi include: Doctor
    foreignKey: "doctor_id"
 });

 module.exports = DoctorAvailability;