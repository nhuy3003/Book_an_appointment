const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// DB: doctor bảng có created_at, updated_at
const Doctor = sequelize.define(
    "Doctor",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        full_name: DataTypes.STRING,
        email: DataTypes.STRING,
        password: DataTypes.STRING,
        phone_number: DataTypes.STRING,
        address: DataTypes.STRING,
        specialty_id: DataTypes.INTEGER,
        image_url: DataTypes.STRING,
        experience_years: DataTypes.INTEGER,
        price_per_appointment: DataTypes.INTEGER,
        bio: DataTypes.TEXT,
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE
    },
    {
        tableName: "doctor",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
);

module.exports = Doctor;