const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// bookable_slot.status: enum('available','booked','off')

const BookableSlot = sequelize.define("BookableSlot", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    doctor_id: DataTypes.INTEGER,
    slot_date: DataTypes.DATEONLY,   // DATE (chỉ ngày, không giờ)
    start_time: DataTypes.TIME,
    end_time: DataTypes.TIME,
    status: {
        type: DataTypes.ENUM("available", "booked", "off"),
        defaultValue: "available"
    },
    availability_id: DataTypes.INTEGER,
},
{
    tableName: "bookable_slot",
    timestamps: false
});

module.exports = BookableSlot;