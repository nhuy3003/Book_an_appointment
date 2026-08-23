const {DataTypes} = require("sequelize");
const sequelize = require("../config/database");
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
        bio: DataTypes.TEXT

    },
    {
        tableName: "doctor",
        timestamps: false
    }
);
module.exports = Doctor;