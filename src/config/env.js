require("dotenv").config();

module.exports = {
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,

  dbHost: process.env.DB_HOST,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME
};