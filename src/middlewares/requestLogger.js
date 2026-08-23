const requestLogger = (req, res, next) => {
    const time = new Date().toISOString();

    console.log(`[${time}] ${req.method} ${req.originalUrl}`);
    next();
};

module.exports = requestLogger;
