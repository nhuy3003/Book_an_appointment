const doctorRepository = require("../repositories/doctor_availability.repository");
const ApiError = require("../utils/ApiError");

const getDoctorSchedule = async(doctorId) => {
    const schedules = await doctorRepository.getDoctorSchedule(doctorId);

    const result = {};

    schedules.forEach(schedule =>{
        const day = schedule.day_of_week;

        if(!result[day]){
            result[day] = [];
        }
        result[day].push({
            start: schedule.start_time,
            end: schedule.end_time
        });
    });

    return result;
};

const getDoctorScheduleByDay = async(id, day_of_week) =>{
    const schedules = await doctorRepository.getDoctorScheduleByDay(id, day_of_week);

    // Trả về mảng rỗng nếu không tìm thấy lịch (không phải lỗi)
    return schedules || [];
};

const createSchedule = async(data)=>{
    // Xác thực các trường bắt buộc
    const requiredFields = ['doctor_id', 'day_of_week', 'start_time', 'end_time', 'slot_duration_minutes', 'active'];
    for(const field of requiredFields) {
        if(data[field] === null || data[field] === undefined || data[field] === '') {
            throw new ApiError(400, `Trường "${field}" là bắt buộc`);
        }
    }

    // Xác thực day_of_week
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if(!validDays.includes(data.day_of_week)) {
        throw new ApiError(400, `Ngày tuần không hợp lệ. Phải là một trong: ${validDays.join(', ')}`);
    }

    // Xác thực định dạng thời gian và so sánh
    if(data.start_time >= data.end_time){
        throw new ApiError(400, "Giờ bắt đầu phải nhỏ hơn giờ kết thúc");
    }

    // Xác thực slot_duration_minutes
    if(data.slot_duration_minutes <= 0) {
        throw new ApiError(400, "slot_duration_minutes phải lớn hơn 0");
    }

    // Xác thực trường active là boolean
    if(typeof data.active !== 'boolean') {
        throw new ApiError(400, "active phải là giá trị boolean");
    }

    return await doctorRepository.createSchedule(data);
}

const updateSchedule = async(id, data)=>{
    const schedule = await doctorRepository.findScheduleById(id)
    if(!schedule){
        throw new ApiError(404, "Không tìm thấy lịch");
    }

    // Xác thực các trường thời gian nếu có
    if(data.start_time !== undefined || data.end_time !== undefined) {
        const startTime = data.start_time !== undefined ? data.start_time : schedule.start_time;
        const endTime = data.end_time !== undefined ? data.end_time : schedule.end_time;
        
        if(startTime >= endTime) {
            throw new ApiError(400, "Giờ bắt đầu phải nhỏ hơn giờ kết thúc");
        }
    }

    // Xác thực day_of_week nếu có
    if(data.day_of_week) {
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        if(!validDays.includes(data.day_of_week)) {
            throw new ApiError(400, `Ngày tuần không hợp lệ. Phải là một trong: ${validDays.join(', ')}`);
        }
    }

    // Xác thực slot_duration_minutes nếu có
    if(data.slot_duration_minutes !== undefined && data.slot_duration_minutes <= 0) {
        throw new ApiError(400, "slot_duration_minutes phải lớn hơn 0");
    }

    return await doctorRepository.updateSchedule(id, data);
}

const deleteSchedule = async(id)=>{
    const schedule = await doctorRepository.findScheduleById(id);
    if(!schedule){
        throw new ApiError(404, "Không tìm thấy lịch");
    }
    return await doctorRepository.deleteSchedule(id);
}

const disableSchedule = async(id) =>{
    const schedule = await doctorRepository.findScheduleById(id);
    if(!schedule){
        throw new ApiError(404, "Không tìm thấy lịch");
    }

    return await doctorRepository.updateSchedule(id, {active: false});
}

const findScheduleById = async(id) => {
    return await doctorRepository.findScheduleById(id);
};

module.exports={
    getDoctorSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    disableSchedule,
    getDoctorScheduleByDay,
    findScheduleById
};