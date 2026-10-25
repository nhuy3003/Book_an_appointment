const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const BookableSlot = require("../models/bookable_slot.model");
const Patient = require("../models/patient.model");

// appointment.status: enum('pending','confirmed','completed','cancelled','missed')
// appointment.payment_method: enum('offline','online')
// appointment.payment_status: enum('pending','paid','failed','refunded')

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
        status: {
            type: DataTypes.ENUM("pending", "confirmed", "completed", "cancelled", "missed"),
            defaultValue: "pending"
        },
        reason_for_visit: DataTypes.TEXT,
        note: DataTypes.STRING,
        price: DataTypes.INTEGER,
        payment_method: {
            type: DataTypes.ENUM("offline", "online"),
            defaultValue: "offline"
        },
        payment_status: {
            type: DataTypes.ENUM("pending", "paid", "failed", "refunded"),
            defaultValue: "pending"
        },
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
Appointment.belongsTo(BookableSlot, { foreignKey: "bookable_slot_id" });
Appointment.belongsTo(Patient, { foreignKey: "patient_id" });

module.exports = Appointment;