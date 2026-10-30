const express = require("express");
const router = express.Router();

const doctorController = require("../controllers/doctor.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   - name: Doctor
 *     description: Quản lý thông tin bác sĩ
 */

/**
 * @swagger
 * /api/doctor/all:
 *   get:
 *     summary: Lấy danh sách tất cả bác sĩ (công khai)
 *     tags: [Doctor]
 *     parameters:
 *       - in: query
 *         name: specialty_id
 *         schema:
 *           type: integer
 *         description: Lọc theo chuyên khoa
 *     responses:
 *       200:
 *         description: Danh sách bác sĩ
 */
router.get("/all", doctorController.getAllDoctors);

/**
 * @swagger
 * /api/doctor/specialties:
 *   get:
 *     summary: Lấy danh sách chuyên khoa (công khai)
 *     tags: [Doctor]
 *     responses:
 *       200:
 *         description: Danh sách chuyên khoa
 */
router.get("/specialties", doctorController.getAllSpecialties);

/**
 * @swagger
 * /api/doctor/{id}/available-slots:
 *   get:
 *     summary: Lấy slot khám còn trống của bác sĩ theo ngày (công khai)
 *     tags: [Doctor]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày khám (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Danh sách slot còn trống
 *       400:
 *         description: Thiếu tham số date
 */
router.get("/:id/available-slots", doctorController.getAvailableSlots);

/**
 * @swagger
 * /api/doctor/{id}/available-dates:
 *   get:
 *     summary: Lấy danh sách các ngày bác sĩ còn khung giờ trống (công khai, mặc định 14 ngày tới)
 *     tags: [Doctor]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: "[{ date: 'YYYY-MM-DD', available: số slot trống }]"
 */
router.get("/:id/available-dates", doctorController.getAvailableDates);

/**
 * @swagger
 * /api/doctor/profile:
 *   get:
 *     summary: Lấy thông tin hồ sơ bác sĩ (cần đăng nhập)
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *       401:
 *         description: Chưa đăng nhập
 */
router.get("/profile", authMiddleware, doctorController.getDoctorById);

/**
 * @swagger
 * /api/doctor/profile:
 *   put:
 *     summary: Cập nhật thông tin hồ sơ bác sĩ (cần đăng nhập)
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Chưa đăng nhập
 */
router.put("/profile", authMiddleware, doctorController.updateProfile);

module.exports = router;