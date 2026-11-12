/**
 * Máy trạng thái lịch hẹn (Service kiểm soát, không tin status từ client).
 *
 * pending   → confirmed | cancelled
 * confirmed → completed | missed | cancelled
 * cancelled / completed / missed → không chuyển tiếp
 */
const ALLOWED_STATUS_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "missed", "cancelled"],
  cancelled: [],
  completed: [],
  missed: [],
};

const APPOINTMENT_STATUSES = Object.keys(ALLOWED_STATUS_TRANSITIONS);

const ACTIVE_STATUSES = ["pending", "confirmed"];

const SLOT_STATUSES_THAT_REOPEN = ["cancelled", "missed"];

const PATIENT_CANCEL_FROM = ["pending", "confirmed"];

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

module.exports = {
  ALLOWED_STATUS_TRANSITIONS,
  APPOINTMENT_STATUSES,
  ACTIVE_STATUSES,
  SLOT_STATUSES_THAT_REOPEN,
  PATIENT_CANCEL_FROM,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};
