require("dotenv").config();   // Load .env TRƯỚC KHI làm bất cứ thứ gì
const app = require("./app");

process.on("unhandledRejection", (reason) => {
    console.error("unhandledRejection:", reason);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📖 Swagger UI: http://localhost:${PORT}/api-docs`);
});