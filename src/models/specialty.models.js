const {DataTypes} = require("sequelize");
const sequelize = require("../config/database");

const Specialty = sequelize.define(
    "Specialty",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        specialty_name: DataTypes.STRING,
        description: DataTypes.TEXT
    },
    {
        tableName: "specialty",
        timestamps: false
    }
);

module.exports = Specialty;