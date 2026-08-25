const doctorRepository = require("../repositories/doctor.repository");
const ApiError = require("../utils/ApiError");

const getDoctorSchedule = async (doctorId) => {
    const schedules = await doctorRepository.getDoctorSchedule(doctorId);
    const result ={};

    schedules.forEach(schedule => {
        const day = schedule.day_of_week;
        if (!result[day]) {
            result[day] = [];
        }
        result[day].push({
            start_time: schedule.start_time,
            end_time: schedule.end_time
        });
    if(!result[day]){
        result[day] = [];
    }
    result[day].push({
        start_time: schedule.start_time,
        end_time: schedule.end_time
    });
});
    return result;
};

const getDoctorScheduleByDay = async (id, day_of_week) => {
    const schedule = await doctorRepository.getDoctorScheduleByDay(id, day_of_week);
    // tra ve mang rong neu khong tim thay lich lam viec (khong phai loi)
    return schedule || [];
};

module.exports = {
    getDoctorSchedule,
    getDoctorScheduleByDay
};