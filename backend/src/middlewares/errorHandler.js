const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    console.error("ERROR:", err);

    const payload = {
        success: false,
        message: err.message || "Internal Server Error",
    };
    if (err.errors) payload.errors = err.errors;

    res.status(statusCode).json(payload);
};

module.exports = errorHandler;