const notificationService = require("../services/notification.service");
const response = require("../utils/response");

// Lấy thông báo của bác sĩ
const getNotificationsByDoctorId = async (req, res, next) => {
    try {
        const doctorId = req.user.id;

        const notifications = await notificationService.getNotificationsByDoctorId(doctorId);

        return response.success(
            res,
            notifications,
            "Lấy thông báo thành công"
        );
    } catch (error){
        next (error);
    }
};

// Đánh dấu 1 thông báo đã đọc
const markAsRead = async (req, res, next) => {
    try {
        const doctorId = req.user.id;
        const { id } = req.params;

        const notification = await notificationService.markAsRead(id, doctorId);

        return response.success(res, notification, "Đánh dấu đã đọc thành công");
    } catch (error) {
        next(error);
    }
};

// Đánh dấu tất cả thông báo đã đọc
const markAllAsRead = async (req, res, next) => {
    try {
        const doctorId = req.user.id;

        const count = await notificationService.markAllAsRead(doctorId);

        return response.success(res, { updatedCount: count }, "Đánh dấu tất cả đã đọc thành công");
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotificationsByDoctorId,
    markAsRead,
    markAllAsRead
}