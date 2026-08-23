module.exports = {
    port: process.env.PORT || 3000,
    jwtSecret: process.env.JWT_SECRET || "your_jwt_secret",

    dbHost: process.env.DB_HOST || "localhost",
    dbUser: process.env.DB_USER || "root",
    dbPass: process.env.DB_PASS || "password",
    dbName: process.env.DB_NAME || "mydatabase"
};