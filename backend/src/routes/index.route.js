const express = require("express");
const router = express.Router();

const authRoute = require("./auth.route");
const appointmentRoute = require("./appointment.route");
const dashboardRoute = require("./dashboard.route");
const doctorRoute = require("./doctor.route");
const notificationRoute = require("./notification.route");
const mailRoute = require("./mail.route");
const doctorAvailabilityRoute = require("./doctor_availability.route");
const reportsRoute = require("./reports.route");

router.use("/auth", authRoute);
router.use("/appointments", appointmentRoute);
router.use("/dashboard", dashboardRoute);
router.use("/doctor", doctorRoute);
router.use("/notifications", notificationRoute);
router.use("/mail", mailRoute);
router.use("/doctor-availability", doctorAvailabilityRoute);
router.use("/reports", reportsRoute);

module.exports = router;