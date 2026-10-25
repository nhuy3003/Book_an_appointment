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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "abc123"
 *                   title:
 *                     type: string
 *                     example: Lịch hẹn mới
 *                   message:
 *                     type: string
 *                     example: Bạn có lịch hẹn mới từ bệnh nhân
 *                   isRead:
 *                     type: boolean
 *                     example: false
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Chưa đăng nhập
 */
router.get(
  "/",
  authMiddleware,
  notificationController.getNotificationsByDoctorId
);

module.exports = router;