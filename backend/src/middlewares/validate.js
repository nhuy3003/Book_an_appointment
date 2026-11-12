const { body, query, validationResult } = require("express-validator");
const ApiError = require("../utils/apiError");
const { APPOINTMENT_STATUSES } = require("../constants/appointment.constants");

const validate = (req, res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();

    const errors = result.array().map((e) => ({
        field: e.path,
        message: e.msg
    }));
    const err = new ApiError(400, errors[0].message);
    err.errors = errors;
    next(err);
};

const loginRules = [
    body("email").isEmail().withMessage("Email không hợp lệ"),
    body("password").notEmpty().withMessage("Mật khẩu là bắt buộc"),
    validate
];

const isPositiveInt = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const createAppointmentRules = [
    body("bookable_slot_id").custom(isPositiveInt).withMessage("Khung giờ khám không hợp lệ"),
    body("phone_number").notEmpty().withMessage("Số điện thoại là bắt buộc"),
    body("patient_name").notEmpty().withMessage("Họ tên bệnh nhân là bắt buộc"),
    body("email").optional({ checkFalsy: true }).isEmail().withMessage("Email không hợp lệ"),
    validate
];

const updateAppointmentStatusRules = [
    body("status")
        .notEmpty().withMessage("Trạng thái là bắt buộc")
        .isIn(APPOINTMENT_STATUSES).withMessage("Trạng thái không hợp lệ"),
    validate
];

const cancelAppointmentByCodeRules = [
    body("phone_number").notEmpty().withMessage("Số điện thoại là bắt buộc để hủy lịch"),
    validate
];

const listAppointmentQueryRules = [
    query("page").optional().isInt({ min: 1 }).withMessage("page phải là số nguyên ≥ 1"),
    query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("limit tối đa 50"),
    query("status").optional().isIn([...APPOINTMENT_STATUSES, "all"]).withMessage("Trạng thái lọc không hợp lệ"),
    query("date").optional({ checkFalsy: true }).matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("Ngày khám phải theo định dạng YYYY-MM-DD"),
    validate
];

const bulkScheduleRules = [
    body("days").isArray({ min: 1 }).withMessage("Chọn ít nhất 1 thứ trong tuần"),
    body("shifts").isArray({ min: 1 }).withMessage("Thêm ít nhất 1 khung giờ"),
    body("slot_duration_minutes").custom(isPositiveInt).withMessage("Thời lượng slot không hợp lệ"),
    validate
];

module.exports = {
    validate,
    loginRules,
    createAppointmentRules,
    updateAppointmentStatusRules,
    cancelAppointmentByCodeRules,
    listAppointmentQueryRules,
    bulkScheduleRules
};
