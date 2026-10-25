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

module.exports = {
    getNotificationsByDoctorId
}