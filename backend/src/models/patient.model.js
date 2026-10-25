const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// DB: patient có thêm trường `password`
const Patient = sequelize.define(
    "Patient",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        full_name: DataTypes.STRING,
        email: DataTypes.STRING,
        phone_number: DataTypes.STRING,
        address: DataTypes.STRING,
        password: DataTypes.STRING,  // có trong DB
        created_at: DataTypes.DATE
    },
    {
        tableName: "patient",
        timestamps: false
    }
);

module.exports = Patient;