const express = require("express");
const path = require("path"); // duong link
const cors = require("cors"); 
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const routes = require("./routes/index.route");
const errorHandler = require("./middlewares/errorHandler");
const requestLogger = require("./middlewares/requestLogger");
const authRoutes = require("./routes/auth.route");
const app = express();

// Middleware
app.use(cors()); // cho phep FE tu domain khac goi API (tranh loi CORS)
app.use(express.json()); // parse body json
app.use(express.urlencoded({ extended: true })); // parse body form data

app.use(requestLogger); // log cac request API
// --- Cấu hình Swagger ---
const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "My API Documentation",
        version: "1.0.0",
        description: "Tài liệu hướng dẫn sử dụng các endpoint API",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
    },
      servers: [
        {
          url: "http://localhost:3000", // Có thể thay đổi port phù hợp
          description: "Development server",
        },
      ],
    },
    // Quan trọng: Chỉ định nơi viết chú thích @swagger (JSDoc)
    apis: [path.join(__dirname, "routes/**/*.js")]
  };
  
  const swaggerDocs = swaggerJsdoc(swaggerOptions);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
// Routes
app.use("/api", routes); // tất cả API bắt đầu bằng /api
app.use("/api/auth", authRoutes);
// Error handler (luôn đặt cuối)
app.use(errorHandler);

module.exports = app;

