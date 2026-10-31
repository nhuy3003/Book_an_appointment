const { Server } = require("socket.io");

let io = null;

/**
 * Khởi tạo Socket.io Server gắn liền với HTTP server
 * @param {import("http").Server} httpServer
 */
function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: "*", // Hoặc chỉ định rõ client URL
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        // Bác sĩ join vào room cá nhân theo doctorId
        socket.on("join_doctor", (doctorId) => {
            if (doctorId) {
                const roomName = `doctor:${doctorId}`;
                socket.join(roomName);
                console.log(`[Socket] Client ${socket.id} joined room: ${roomName}`);
            }
        });

        socket.on("disconnect", () => {
            // Ngắt kết nối socket
        });
    });

    return io;
}

/**
 * Lấy instance socket.io
 */
function getIO() {
    if (!io) {
        throw new Error("Socket.io chưa được khởi tạo!");
    }
    return io;
}

/**
 * Emit event tới riêng phòng của bác sĩ
 * @param {number|string} doctorId 
 * @param {string} event 
 * @param {object} data 
 */
function emitToDoctor(doctorId, event, data) {
    if (io) {
        io.to(`doctor:${doctorId}`).emit(event, data);
    }
}

module.exports = {
    initSocket,
    getIO,
    emitToDoctor
};

