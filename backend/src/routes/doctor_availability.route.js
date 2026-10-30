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

// ===== CÁC ROUTE TĨNH (đặt trước /:id) =====

/**
 * @swagger
 * /api/doctor-availability/me/templates:
 *   get:
 *     summary: Lấy tất cả mẫu lịch hàng tuần (kể cả đang tắt) của bác sĩ đang đăng nhập
 *     tags: [Doctor Availability]
 *     security:
 *       - bearerAuth: []
 */
router.get("/me/templates", authMiddleware, doctorController.getMyTemplates);

/**
 * @swagger
 * /api/doctor-availability/me/slots:
 *   get:
 *     summary: Lấy các khung giờ (bookable_slot) theo khoảng ngày của bác sĩ đang đăng nhập
 *     tags: [Doctor Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema: { type: string, example: "2026-11-02" }
 *       - in: query
 *         name: to
 *         required: true
 *         schema: { type: string, example: "2026-11-08" }
 */
router.get("/me/slots", authMiddleware, doctorController.getMySlots);

/**
 * @swagger
 * /api/doctor-availability/bulk:
 *   post:
 *     summary: Tạo nhiều ca cùng lúc (nhiều thứ x nhiều khung giờ) và tự sinh slot cho N tuần tới
 *     tags: [Doctor Availability]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
 *               shifts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     start_time: { type: string, example: "08:00" }
 *                     end_time: { type: string, example: "11:30" }
 *               slot_duration_minutes: { type: integer, example: 30 }
 *               weeks: { type: integer, example: 4 }
 */
router.post("/bulk", authMiddleware, doctorController.bulkCreateSchedules);

/**
 * @swagger
 * /api/doctor-availability/generate-slots:
 *   post:
 *     summary: Sinh khung giờ khám cho khoảng ngày cụ thể từ các mẫu lịch đang bật (bỏ qua slot đã có)
 *     tags: [Doctor Availability]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from: { type: string, example: "2026-11-01" }
 *               to: { type: string, example: "2026-11-30" }
 */
router.post("/generate-slots", authMiddleware, doctorController.generateSlots);

/**
 * @swagger
 * /api/doctor-availability/day-off:
 *   patch:
 *     summary: Nghỉ cả ngày (off=true) hoặc mở lại ngày (off=false). Slot đã đặt giữ nguyên.
 *     tags: [Doctor Availability]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date: { type: string, example: "2026-11-05" }
 *               off: { type: boolean, example: true }
 */
router.patch("/day-off", authMiddleware, doctorController.setDayOff);

/**
 * @swagger
 * /api/doctor-availability/slots/{slotId}/status:
 *   patch:
 *     summary: Bật/tắt 1 khung giờ (available | off)
 *     tags: [Doctor Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [available, off] }
 */
router.patch("/slots/:slotId/status", authMiddleware, doctorController.setSlotStatus);

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