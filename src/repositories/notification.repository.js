const Notification = require("../models/notification.model"); 

// Tạo thông báo
const createNotification = async(data) => {
    return await Notification.create(data);
};

// Lấy thông báo của bác sĩ
const getNotificationsByDoctorId = async(doctorId) => {
    return await Notification.findAll({
        where: {
            doctor_id: doctorId
        },
        order: [
            ["created_at", "DESC"]
        ]
    });
};

module.exports = {
    createNotification,
    getNotificationsByDoctorId
};