const { Sequelize } = require("sequelize");
const env = require("./env");

const sequelize = new Sequelize(
    env.dbName,
    env.dbUser,
    env.dbPass,
    {
        host: env.dbHost,
        dialect: "mysql",
        logging:false
    }
);

module.exports = sequelize;