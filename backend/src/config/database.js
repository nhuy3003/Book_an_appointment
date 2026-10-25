const { Sequelize } = require("sequelize");
const env = require("./env");

const sequelize = new Sequelize(
    env.dbName,
    env.dbUser,
    env.dbPassword,   // đổi từ env.dbPass -> env.dbPassword
    {
        host: env.dbHost,
        dialect: "mysql",
        logging: false
    }
);

module.exports = sequelize;