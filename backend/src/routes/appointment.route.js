const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointment.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { createAppointmentRules } = require("../middlewares/validate");

/**
 * @swagger
 * tags:
 *   - name: Appointments
 *     description: Quản lý lịch hẹn của bác sĩ
 */

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Lấy danh sách lịch hẹn của bác sĩ
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về danh sách lịch hẹn
 */
router.get("/", authMiddleware, appointmentController.getAppointmentsByDoctorId);

// Tra cứu công khai theo mã - ĐặT TRƯỚC /:id để tránh bị match nhầm
router.get("/code/:code", appointmentController.getAppointmentByCode);

/**
 * @swagger
 * /api/appointments/create:
 *   post:
 *     summary: Tạo lịch hẹn mới
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientName:
 *                 type: string
 *               appointmentDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post("/create", createAppointmentRules, appointmentController.createAppointment);


/**
 * @swagger
 * /api/appointments/by-status/{status}:
 *   get:
 *     summary: Lấy lịch hẹn theo tình trạng
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *         description: Trạng thái lịch hẹn
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/by-status/:status", authMiddleware, appointmentController.getAppointmentsByStatus);


/**
 * @swagger
 * /api/appointments/date/{date}:
 *   get:
 *     summary: Lấy lịch hẹn theo ngày khám
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Định dạng YYYY-MM-DD
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/date/:date", authMiddleware, appointmentController.getAppointmentsByDate);


/**
 * @swagger
 * /api/appointments/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái lịch hẹn
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch("/:id/status", authMiddleware, appointmentController.updateAppointmentStatus);


/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Lấy chi tiết lịch hẹn
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết lịch hẹn
 */
router.get("/:id", authMiddleware, appointmentController.getAppointmentDetail);

module.exports = router;