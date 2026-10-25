const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Doctor = require("../models/doctor.model");
const Patient = require("../models/patient.model");

const Notification = sequelize.define(
    "Notification",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        doctor_id: DataTypes.INTEGER,   // FK -> doctor.id
        patient_id: DataTypes.INTEGER,  // FK -> patient.id
        title: DataTypes.STRING,
        message: DataTypes.TEXT,
        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        created_at: DataTypes.DATE
    },
    {
        tableName: "notification",
        timestamps: false  // DB chỉ có created_at, không có updatedAt
    }
);

// association
Notification.belongsTo(Doctor, { foreignKey: "doctor_id" });
Notification.belongsTo(Patient, { foreignKey: "patient_id" });

module.exports = Notification;
