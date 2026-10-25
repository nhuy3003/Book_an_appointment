const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Thống kê tổng quan hệ thống
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Lấy dữ liệu thống kê dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy dữ liệu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAppointments:
 *                   type: integer
 *                   example: 120
 *                 pendingAppointments:
 *                   type: integer
 *                   example: 30
 *                 confirmedAppointments:
 *                   type: integer
 *                   example: 70
 *                 cancelledAppointments:
 *                   type: integer
 *                   example: 20
 *       401:
 *         description: Chưa đăng nhập
 */
router.get(
  "/",
  authMiddleware,
  dashboardController.getDashboardStats
);

module.exports = router;