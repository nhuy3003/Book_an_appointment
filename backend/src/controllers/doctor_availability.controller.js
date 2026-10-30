const doctorService = require("../services/doctor_availability.service");

// Trả lỗi theo statusCode của ApiError (mặc định 400)
const sendError = (res, error) => res.status(error.statusCode || 400).json({
    success: false,
    message: error.message
});

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
            data: result,
            message: `Tạo ca thành công, đã sinh ${result.slots?.created || 0} khung giờ khám`
        });
    } catch(error){
        sendError(res, error);
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
        sendError(res, error);
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

        const result = await doctorService.deleteSchedule(id);

        res.json({
            success: true,
            data: result,
            message: result.disabled
                ? `Ca này đã có ${result.bookedCount} lịch hẹn nên được chuyển sang TẠM TẮT thay vì xóa (lịch hẹn cũ được giữ nguyên)`
                : "Xóa lịch thành công"
        });

    } catch(error){
        sendError(res, error);
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
        sendError(res, error);
    }
};

// Tạo nhiều ca cùng lúc (nhiều thứ x nhiều khung giờ) + tự sinh slot N tuần tới
const bulkCreateSchedules = async (req, res) => {
    try {
        const result = await doctorService.bulkCreateSchedules(req.user.id, req.body);
        res.status(201).json({
            success: true,
            data: result,
            message: `Đã tạo ${result.created.length} ca, sinh ${result.slots.created} khung giờ khám`
                + (result.skipped.length ? ` (bỏ qua ${result.skipped.length} ca bị trùng giờ)` : "")
        });
    } catch (error) {
        sendError(res, error);
    }
};

// Sinh slot theo khoảng ngày từ các mẫu lịch đang bật
const generateSlots = async (req, res) => {
    try {
        const { from, to } = req.body || {};
        const result = await doctorService.generateSlots(req.user.id, from, to);
        res.json({
            success: true,
            data: result,
            message: `Đã sinh ${result.created} khung giờ khám mới`
        });
    } catch (error) {
        sendError(res, error);
    }
};

// Lấy tất cả mẫu lịch (kể cả đang tắt) của bác sĩ đang đăng nhập
const getMyTemplates = async (req, res) => {
    try {
        const data = await doctorService.getMyTemplates(req.user.id);
        res.json({ success: true, data });
    } catch (error) {
        sendError(res, error);
    }
};

// Lấy slot theo khoảng ngày của bác sĩ đang đăng nhập
const getMySlots = async (req, res) => {
    try {
        const { from, to } = req.query;
        const data = await doctorService.getMySlots(req.user.id, from, to);
        res.json({ success: true, data });
    } catch (error) {
        sendError(res, error);
    }
};

// Bật/tắt 1 slot
const setSlotStatus = async (req, res) => {
    try {
        const data = await doctorService.setSlotStatus(req.user.id, req.params.slotId, req.body?.status);
        res.json({ success: true, data });
    } catch (error) {
        sendError(res, error);
    }
};

// Nghỉ cả ngày / mở lại ngày
const setDayOff = async (req, res) => {
    try {
        const { date, off } = req.body || {};
        const data = await doctorService.setDayOff(req.user.id, date, off !== false);
        res.json({
            success: true,
            data,
            message: data.off
                ? `Đã đánh dấu nghỉ ngày ${date}` + (data.bookedCount ? ` (còn ${data.bookedCount} lịch hẹn đã đặt, vui lòng xử lý)` : "")
                : `Đã mở lại lịch ngày ${date}`
        });
    } catch (error) {
        sendError(res, error);
    }
};

module.exports = {
    getDoctorSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    disableSchedule,
    getDoctorScheduleByDay,
    bulkCreateSchedules,
    generateSlots,
    getMyTemplates,
    getMySlots,
    setSlotStatus,
    setDayOff
};