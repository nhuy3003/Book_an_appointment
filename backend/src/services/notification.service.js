const notificationRepository = require("../repositories/notification.repository");
const ApiError = require("../utils/ApiError");

// Tạo thông báo
const createNotification = async(doctorId, patientId, title, message) => {
    return await notificationRepository.createNotification({
        doctor_id: doctorId,
        patient_id: patientId,
        title,
        message
    });
};

// Lấy thông báo của bác sĩ (trả về [] nếu không có, không throw lỗi)
const getNotificationsByDoctorId = async(doctorId) => {
    const notifications = await notificationRepository.getNotificationsByDoctorId(doctorId);
    return notifications || [];
};

// Đánh dấu 1 thông báo đã đọc
const markAsRead = async(notificationId, doctorId) => {
    const notification = await notificationRepository.markAsRead(notificationId, doctorId);
    if (!notification) {
        throw new ApiError(404, "Không tìm thấy thông báo");
    }
    return notification;
};

// Đánh dấu tất cả thông báo đã đọc
const markAllAsRead = async(doctorId) => {
    const count = await notificationRepository.markAllAsRead(doctorId);
    return count;
};

module.exports = {
    createNotification,
    getNotificationsByDoctorId,
    markAsRead,
    markAllAsRead
}