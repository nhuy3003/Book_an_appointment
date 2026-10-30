const Notification = require("../models/notification.model");

// Tạo thông báo mới
// data: { doctor_id, patient_id, title, message }
const createNotification = async (data) => {
    return await Notification.create(data);
};

// Lấy thông báo của bác sĩ theo doctor_id
const getNotificationsByDoctorId = async (doctorId) => {
    return await Notification.findAll({
        where: {
            doctor_id: doctorId
        },
        order: [["created_at", "DESC"]]
    });
};

// Đánh dấu 1 thông báo đã đọc
const markAsRead = async (notificationId, doctorId) => {
    const notification = await Notification.findOne({
        where: { id: notificationId, doctor_id: doctorId }
    });
    if (!notification) return null;
    notification.is_read = true;
    await notification.save();
    return notification;
};

// Đánh dấu tất cả thông báo của bác sĩ đã đọc
const markAllAsRead = async (doctorId) => {
    const [count] = await Notification.update(
        { is_read: true },
        { where: { doctor_id: doctorId, is_read: false } }
    );
    return count;
};

module.exports = {
    createNotification,
    getNotificationsByDoctorId,
    markAsRead,
    markAllAsRead
};
