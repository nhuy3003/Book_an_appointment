const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Xác thực người dùng
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập bác sĩ
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: doctor@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       401:
 *         description: Sai thông tin đăng nhập
 */
router.post("/login", authController.loginDoctor);


/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Đổi mật khẩu
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: 123456
 *               newPassword:
 *                 type: string
 *                 example: 12345678
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 */
router.post("/change-password", authMiddleware, authController.changePassword);


/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *       401:
 *         description: Chưa đăng nhập
 */
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;