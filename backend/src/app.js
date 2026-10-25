const express = require("express");
const path = require("path");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

// Khởi tạo tất cả associations giữa các model (PHẢI gọi trước khi dùng route)
require("./models/index");

const routes = require("./routes/index.route");
const errorHandler = require("./middlewares/errorHandler");
const requestLogger = require("./middlewares/requestLogger");

const app = express();

// ============ Middleware ============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ============ Swagger ============
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Book An Appointment API",
            version: "1.0.0",
            description: "API hệ thống đặt lịch khám bệnh - XAMPP / MySQL"
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Development server (XAMPP)"
            }
        ]
    },
    // Dùng relative path để swagger-jsdoc đọc được trên Windows
    apis: ["./src/routes/*.js"]
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs, { explorer: true }));

// ============ Routes (tất cả qua index.route.js) ============
app.use("/api", routes);

// ============ Error Handler (luôn đặt cuối) ============
app.use(errorHandler);

module.exports = app;
