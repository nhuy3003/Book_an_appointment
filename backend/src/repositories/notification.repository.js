const Notification = require("../models/notification.model");

// Lấy tất cả thông báo của một user (doctor hoặc patient)
const findNotificationsByUser = async (user_id, user_type) => {
    return await Notification.findAll({
        where: { user_id, user_type },
        order: [["created_at", "DESC"]]
    });
};

// Lấy các thông báo chưa đọc
const findUnreadNotifications = async (user_id, user_type) => {
    return await Notification.findAll({
        where: { user_id, user_type, is_read: false },
        order: [["created_at", "DESC"]]
    });
};

// Tìm thông báo theo id
const findNotificationById = async (id) => {
    return await Notification.findByPk(id);
};

// Tạo thông báo mới
const createNotification = async (data) => {
    return await Notification.create(data);
};

// Đánh dấu thông báo đã đọc
const markAsRead = async (id) => {
    return await Notification.update(
        { is_read: true },
        { where: { id } }
    );
};

// Đánh dấu tất cả thông báo của user đã đọc
const markAllAsRead = async (user_id, user_type) => {
    return await Notification.update(
        { is_read: true },
        { where: { user_id, user_type, is_read: false } }
    );
};

// Xóa thông báo
const deleteNotification = async (id) => {
    return await Notification.destroy({
        where: { id }
    });
};

module.exports = {
    findNotificationsByUser,
    findUnreadNotifications,
    findNotificationById,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
