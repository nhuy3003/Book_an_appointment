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

// Lấy thông báo của bác sĩ
const getNotificationsByDoctorId = async(doctorId) => {
    const notifications = await notificationRepository.getNotificationsByDoctorId(doctorId);

    if(!notifications || notifications.length === 0){
        throw new ApiError(404, "Không có thông báo");
    }

    return notifications;
}

module.exports = {
    createNotification,
    getNotificationsByDoctorId
}