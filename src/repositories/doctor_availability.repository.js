const DoctorAvailability  = require("../models/doctor_availability.model");
// lay toan bo lich lam viec cua bsi
const getDoctorScheduleByDoctor = async(doctorId) =>{
    const schedule = await DoctorAvailability.findAll({
        where:{
            doctor_id: doctorId,
            active: true
        },
        attributes: ["day_of_week", "start_time", "end_time"]
    });

    return schedule;
}

//lấy lịch theo ngày làm việc
const getDoctorScheduleByDay = async(id, day_of_week) => {
    return await DoctorAvailability.findAll({
        where:{
            doctor_id : id,
            day_of_week: day_of_week,
            active: true
        },
        attributes: ["id", "day_of_week", "start_time", "end_time", "slot_duration_minutes"]
    });
};

const createSchedule = async(data) =>{
    return await DoctorAvailability.create(data);
};

const updateSchedule = async(id, data) =>{
    const result = await DoctorAvailability.update(data, {
        where: {id}
    });

    // Kiểm tra có cập nhật được không
    if(result[0] === 0) {
        throw new Error("Không tìm thấy lịch hoặc không có thay đổi");
    }

    return await DoctorAvailability.findByPk(id)
};

const findScheduleById = async(id) =>{
    return await DoctorAvailability.findByPk(id);
}

const deleteSchedule = async(id)=>{
    return await DoctorAvailability.destroy({
        where: {id}
    })
};

const disableSchedule = async(id) =>{
    return await DoctorAvailability.update(
        {active: false},
        {where:{id}}
    );
};

module.exports={
    getDoctorSchedule: getDoctorScheduleByDoctor,
    findScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    disableSchedule,
    getDoctorScheduleByDay
};