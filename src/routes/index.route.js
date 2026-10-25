const express = require("express");
const router = express.Router();

const authRoute = require("./auth.route");
const appointmentRoute = require("./appointment.route");
const dashboardRoute = require("./dashboard.route");
const doctorRoute = require("./doctor.route");
const notificationRoute = require("./notification.route");
const mailRoute = require("./mail.route");
const doctor_availability = require("./doctor_availability.route");
const statisticsRoutes = require("./reports.route");

router.use("/auth", authRoute);
router.use("/appointments", appointmentRoute);
router.use("/dashboard", dashboardRoute);
router.use("/doctor", doctorRoute);
router.use("/notifications", notificationRoute);
router.use("/mail", mailRoute);
router.use("/doctor_availability", doctor_availability);
router.use("/reports", statisticsRoutes);

module.exports = router;