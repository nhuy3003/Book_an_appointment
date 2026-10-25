const doctorService = require("../services/doctor_availability.service");

const getDoctorSchedule = async(req, res) =>{
    try{
        const doctorId = req.params.id;
        
        // Xác thực doctorId là số
        if(!doctorId || isNaN(doctorId)) {
            return res.status(400).json({
                success: false,
                message: "ID bác sĩ hợp lệ là bắt buộc"
            });
        }
        
        const schedule = await doctorService.getDoctorSchedule(doctorId);

        res.json({
            success: true,
            data: schedule
        });
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getDoctorScheduleByDay = async(req, res) =>{
  try{
    const id = req.params.id;
    const day = req.params.day;
    
    // Xác thực tham số
    if(!id || isNaN(id)) {
        return res.status(400).json({
            success: false,
            message: "ID bác sĩ hợp lệ là bắt buộc"
        });
    }
    
    if(!day) {
        return res.status(400).json({
            success: false,
            message: "Tham số ngày là bắt buộc"
        });
    }
    
    const schedule = await doctorService.getDoctorScheduleByDay(id, day);

    res.json({
        success: true,
        data: schedule
    });
  }catch(error){
    res.status(400).json({
        success: false,
        message: error.message
    });
  }
};

const createSchedule = async(req, res) => {
    try {
        const data = req.body;

        // Xác thực body request tồn tại
        if(!data || Object.keys(data).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Body yêu cầu là bắt buộc"
            });
        }

        // Lấy doctor_id từ token
        data.doctor_id = req.user.id;

        const result = await doctorService.createSchedule(data);

        res.status(201).json({
            success: true,
            data: result
        });
    } catch(error){
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const updateSchedule = async(req, res) => {
    try {
        const id = req.params.idCalendar;
        
        // Xác thực tham số ID
        if(!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "ID lịch hợp lệ là bắt buộc"
            });
        }
        
        // Xác thực body request tồn tại
        if(!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Body yêu cầu chứa dữ liệu cập nhật là bắt buộc"
            });
        }

        const schedule = await doctorService.findScheduleById(id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lịch"
            });
        }

        // Chỉ cho phép sửa lịch của chính mình
        if (Number(schedule.doctor_id) !== Number(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền"
            });
        }

        const result = await doctorService.updateSchedule(id, req.body);

        res.json({
            success: true,
            data: result
        });
    } catch(error){
        res.status(400).json({
            success: false,
            message:error.message
        });
    }
};

const deleteSchedule = async(req, res) => {
    try {
        const id = req.params.idCalendar;
        
        // Xác thực tham số ID
        if(!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "ID lịch hợp lệ là bắt buộc"
            });
        }

        const schedule = await doctorService.findScheduleById(id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lịch"
            });
        }

        if (Number(schedule.doctor_id) !== Number(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền"
            });
        }

        await doctorService.deleteSchedule(id);

        res.json({
            success: true,
            message: "Xóa lịch thành công"
        });

    } catch(error){
        res.status(400).json({
            success:false,
            message:error.message
        });
    }
};

const disableSchedule = async(req, res) =>{
    try {
        const id = req.params.idCalendar;
        
        // Xác thực tham số ID
        if(!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "ID lịch hợp lệ là bắt buộc"
            });
        }

        const schedule = await doctorService.findScheduleById(id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lịch"
            });
        }

        if (Number(schedule.doctor_id) !== Number(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền"
            });
        }

        await doctorService.disableSchedule(id);

        res.json({
            success: true,
            message: "Tắt lịch thành công"
        });

    } catch(error){
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getDoctorSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    disableSchedule,
    getDoctorScheduleByDay
};