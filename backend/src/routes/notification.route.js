const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notification.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   - name: Notification
 *     description: Quản lý thông báo
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Lấy danh sách thông báo của bác sĩ
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách thông báo thành công
 *       401:
 *         description: Chưa đăng nhập
 */
router.get("/", authMiddleware, notificationController.getNotificationsByDoctorId);

// Alias cho frontend gọi /notifications/my-notifications
router.get("/my-notifications", authMiddleware, notificationController.getNotificationsByDoctorId);

// Đánh dấu tất cả đã đọc - ĐẶT TRƯỚC /:id/read để tránh match nhầm
router.patch("/read-all", authMiddleware, notificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Đánh dấu 1 thông báo đã đọc
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Đánh dấu đã đọc thành công
 *       404:
 *         description: Không tìm thấy thông báo
 */
router.patch("/:id/read", authMiddleware, notificationController.markAsRead);

module.exports = router;