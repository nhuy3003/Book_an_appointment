const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctor_availability.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   - name: Doctor Availability
 *     description: Quản lý lịch làm việc của bác sĩ
 */

/**
 * @swagger
 * /api/doctor-availability/{id}:
 *   get:
 *     summary: Lấy lịch làm việc theo doctorId
 *     tags: [Doctor Availability]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: ID bác sĩ không hợp lệ
*/
router.get("/:id", doctorController.getDoctorSchedule);


/**
 * @swagger
 * /api/doctor-availability:
 *   post:
 *     summary: Tạo lịch làm việc
 *     tags: [Doctor Availability]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - day_of_week
 *               - start_time
 *               - end_time
 *               - slot_duration_minutes
 *               - active
 *             properties:
 *               day_of_week:
 *                 type: string
 *                 enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *                 example: "Monday"
 *               start_time:
 *                 type: string
 *                 example: "08:00"
 *               end_time:
 *                 type: string
 *                 example: "17:00"
 *               slot_duration_minutes:
 *                 type: integer
 *                 example: 30
 *               active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Lỗi xác thực
 */
router.post("/", authMiddleware, doctorController.createSchedule);


/**
 * @swagger
 * /api/doctor-availability/{idCalendar}:
 *   put:
 *     summary: Cập nhật lịch làm việc
 *     tags: [Doctor Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCalendar
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               day_of_week:
 *                 type: string
 *               start_time:
 *                 type: string
 *               end_time:
 *                 type: string
 *               slot_duration_minutes:
 *                 type: integer
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy lịch
 */
router.put("/:idCalendar", authMiddleware, doctorController.updateSchedule);


/**
 * @swagger
 * /api/doctor-availability/{idCalendar}:
 *   delete:
 *     summary: Xóa lịch làm việc
 *     tags: [Doctor Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCalendar
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy lịch
 */
router.delete("/:idCalendar", authMiddleware, doctorController.deleteSchedule);


/**
 * @swagger
 * /api/doctor-availability/{idCalendar}/disable:
 *   patch:
 *     summary: Bật/tắt lịch làm việc
 *     tags: [Doctor Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCalendar
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       404:
 *         description: Không tìm thấy lịch
 */
router.patch("/:idCalendar/disable", authMiddleware, doctorController.disableSchedule);


/**
 * @swagger
 * /api/doctor-availability/{id}/day/{day}:
 *   get:
 *     summary: Lấy lịch làm việc theo ngày
 *     tags: [Doctor Availability]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: day
 *         required: true
 *         schema:
 *           type: string
 *           example: "2026-04-02"
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Tham số không hợp lệ
 */
router.get("/:id/day/:day", doctorController.getDoctorScheduleByDay);

module.exports = router;