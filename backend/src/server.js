require("dotenv").config();   // Load .env TRƯỚC KHI làm bất cứ thứ gì
const http = require("http");
const app = require("./app");
const { initSocket } = require("./utils/socket");

process.on("unhandledRejection", (reason) => {
    console.error("unhandledRejection:", reason);
});

const PORT = process.env.PORT || 3000;

// Tạo HTTP server bọc Express app
const server = http.createServer(app);

// Khởi tạo Socket.io trên HTTP server
initSocket(server);

server.listen(PORT, () => {
    console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📡 Socket.io đã được kích hoạt`);
    console.log(`📖 Swagger UI: http://localhost:${PORT}/api-docs`);
});
