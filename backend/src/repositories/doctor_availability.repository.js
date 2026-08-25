const DoctorAvailability = require("../models/doctor_availability.model");
// lay toan bo lich lam cua bac si
const getDoctorScheduleByDoctor = async (doctorId) => {
    const schedule = await DoctorAvailability.findAll({
        where: {
            doctor_id: doctorId,
            active: true
        },
        attributes: ["day_of_week", "start_time", "end_time"]
    });
    return schedule;
}

// lay lich theo ngay lam viec
const getDoctorScheduleByDay = async (id, day_of_week) => {
    return await DoctorAvailability.findAll({
        // lay dong nao co doctor_id = id va day_of_week = day_of_week va active = true
        where:{
            doctor_id: id,
            day_of_week: day_of_week,
            active: true
        },
        // chon nhng cot nao muon lay ra tu db
        attributes: ["id", "day_of_week","start_time", "end_time", "slot_duration_minutes"]
    });
};

const createSchedule = async (data) => {
    return await DoctorAvailability.create(data);
};



module.exports = {
    getDoctorSchedule: getDoctorScheduleByDoctor,
    getDoctorScheduleByDay,
    createSchedule
};
