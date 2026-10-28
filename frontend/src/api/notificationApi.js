import axiosClient from './axiosClient';

const notificationApi = {
  // Bác sĩ lấy danh sách thông báo & số lượng chưa đọc
  getMyNotifications: () => {
    return axiosClient.get('/notifications/my-notifications');
  },

  // Đánh dấu 1 thông báo đã đọc
  markAsRead: (id) => {
    return axiosClient.patch(`/notifications/${id}/read`);
  },

  // Đánh dấu tất cả thông báo đã đọc
  markAllAsRead: () => {
    return axiosClient.patch('/notifications/read-all');
  },
};

export default notificationApi;

