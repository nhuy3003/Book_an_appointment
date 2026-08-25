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

const createSchedule = async (data) => {
    // Xac thuc cac truong bat buoc
    const requireFields = ["doctor_id","day_of_week","start_time","end_time","slot_duration_minutes"];
    for(const field of requireFields){
        if(!data[field] == null || data[field] === undefined || data[field] === ""){
            
            throw new ApiError(400, `Trường "${field}" là bắt buộc và không được để trống`);
        }
    }

    // xac thuc day_of_week
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    if(!validDays.includes(data.day_of_week)){
        throw new ApiError(400, `Trường "day_of_week" phải là một trong các giá trị sau: ${validDays.join(", ")}`);
    }

    // xac thuc start_time va end_time
    if(data.start_time >= data.end_time){
        throw new ApiError(400, `Giờ bắt đầu phải nhỏ hơn giờ kết thúc`);
    }

    // xac thuc slot_duration_minutes
    if(data.slot_duration_minutes <= 0){
        throw new ApiError(400, `Thời lượng slot phải lớn hơn 0`);
    }
    
    // xac thuc active la boolean
    if(typeof data.active !== "boolean"){
        throw new ApiError(400, `Trường "active" phải là kiểu boolean`);
    }

    return await doctorRepository.createSchedule(data);
};

const updateSchedule = async (id, data) => {
    const schedule = await doctorRepository.findScheduleById(id);
    if (!schedule) {
        throw new ApiError(404, "Không tìm thấy lịch làm việc");
    }

    // xac thuc cac truong thoi gian (neu co)
    if(data.start_time !== undefined || data.end_time !== undefined) {
        const startTime = data.start_time !== undefined ? data.start_time : schedule.start_time;
        const endTime = data.end_time !== undefined ? data.end_time : schedule.end_time;
        
        if(startTime >= endTime) {
            throw new ApiError(400, "Giờ bắt đầu phải nhỏ hơn giờ kết thúc");
        }
    }
    // xac thuc slot_duration_minutes (neu co)
    if(data.slot_duration_minutes !== undefined && data.slot_duration_minutes <= 0) {
        throw new ApiError(400, "Thời lượng slot phải lớn hơn 0");
    }
    return await doctorRepository.updateSchedule(id, data);
}
module.exports = {
    getDoctorSchedule,
    getDoctorScheduleByDay,
    createSchedule,
    updateSchedule
};