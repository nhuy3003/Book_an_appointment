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
 * /api/doctor/profile:
 *   get:
 *     summary: Lấy thông tin hồ sơ bác sĩ
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                   example: Nguyễn Văn A
 *                 email:
 *                   type: string
 *                   example: doctor@example.com
 *                 phone:
 *                   type: string
 *                   example: "0123456789"
 *                 specialty:
 *                   type: string
 *                   example: Tim mạch
 *       401:
 *         description: Chưa đăng nhập
 */
router.get(
  "/profile",
  authMiddleware,
  doctorController.getDoctorById
);


/**
 * @swagger
 * /api/doctor/profile:
 *   put:
 *     summary: Cập nhật thông tin hồ sơ bác sĩ
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               phone:
 *                 type: string
 *                 example: "0123456789"
 *               specialty:
 *                 type: string
 *                 example: Da liễu
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 */
router.put("/profile", authMiddleware, doctorController.updateProfile);

module.exports = router;