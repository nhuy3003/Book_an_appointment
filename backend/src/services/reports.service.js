const {
    getAppointmentStatus,
    getRevenueByYear,
    getAppointmentsByDateRange
} = require("../repositories/reports.repository");

// PIE CHART - Thống kê theo trạng thái
const getStatusStatsService = async (month, year, doctorId) => {
    return await getAppointmentStatus(month, year, doctorId);
};

// BAR + LINE CHART - Thống kê doanh thu theo năm
const getRevenueStatsService = async (year, doctorId) => {
    return await getRevenueByYear(year, doctorId);
};

// TABLE - Lịch hẹn theo khoảng ngày
const getAppointmentsService = async (fromDate, toDate, doctorId) => {
    return await getAppointmentsByDateRange(fromDate, toDate, doctorId);
};

module.exports = {
    getStatusStatsService,
    getRevenueStatsService,
    getAppointmentsService
};
