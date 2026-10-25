const express = require("express");
const router = express.Router();

const mailController = require("../controllers/mail.controller");

/**
 * @swagger
 * tags:
 *   - name: Mail
 *     description: Gửi email hệ thống
 */

/**
 * @swagger
 * /api/mail/test_mail:
 *   post:
 *     summary: Gửi email test
 *     tags: [Mail]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 example: test@example.com
 *               subject:
 *                 type: string
 *                 example: Test Email
 *               text:
 *                 type: string
 *                 example: Đây là email test
 *     responses:
 *       200:
 *         description: Gửi email thành công
 *       500:
 *         description: Lỗi gửi email
 */
router.post("/test_mail", mailController.testSendMail);

module.exports = router;