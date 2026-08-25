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

