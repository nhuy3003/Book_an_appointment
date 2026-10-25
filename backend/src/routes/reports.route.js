const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");

const {
  getAppointmentStatusStats,
  getRevenueStats,
  getAppointments
} = require("../controllers/reports.controller");

/**
 * @swagger
 * tags:
 *   - name: Reports
 *     description: Thống kê và báo cáo hệ thống
 */

/**
 * @swagger
 * /api/reports/appointment-status:
 *   get:
 *     summary: Thống kê số lượng lịch hẹn theo trạng thái
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pending:
 *                   type: integer
 *                   example: 10
 *                 confirmed:
 *                   type: integer
 *                   example: 25
 *                 cancelled:
 *                   type: integer
 *                   example: 5
 */
router.get("/appointment-status", authMiddleware, getAppointmentStatusStats);


/**
 * @swagger
 * /api/reports/revenue-visits:
 *   get:
 *     summary: Thống kê doanh thu và số lượt khám
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: number
 *                   example: 5000000
 *                 totalVisits:
 *                   type: integer
 *                   example: 120
 */
router.get("/revenue-visits", authMiddleware, getRevenueStats);


/**
 * @swagger
 * /api/reports/appointments:
 *   get:
 *     summary: Lấy danh sách lịch hẹn (phục vụ báo cáo)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/appointments", authMiddleware, getAppointments);

module.exports = router;