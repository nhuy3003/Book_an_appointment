const { body, validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

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
    bulkScheduleRules
};
