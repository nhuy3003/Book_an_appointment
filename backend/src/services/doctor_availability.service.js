const doctorAvailabilityRepository = require("../repositories/doctor_availability.repository");
const cache = require("../utils/cache");
const slotRepository = require("../repositories/bookable_slot.repository");
const BookableSlot = require("../models/bookable_slot.model");
const ApiError = require("../utils/ApiError");
const {
    todayStr, isValidDateStr, addDays, dayOfWeek, diffDays, eachDay,
    timeToMinutes, minutesToTime, normalizeTime
} = require("../utils/dateHelper");

const VALID_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_WEEKS = 4;      // so tuan tu dong sinh slot khi tao/sua mau lich
const MAX_RANGE_DAYS = 92;    // gioi han khoang sinh slot (~3 thang)

/**
 * Helper: xóa cache liên quan đến 1 bác sĩ.
 * Dùng lazy require để tránh circular dependency với doctor.service.
 */
const invalidateCache = (doctorId) => {
    const { invalidateDoctorCache } = require("./doctor.service");
    invalidateDoctorCache(doctorId);
};

const getDoctorSchedule = async (doctorId) => {
    const schedules = await doctorAvailabilityRepository.getDoctorSchedule(doctorId);
    const result = {};

    schedules.forEach(schedule => {
        const day = schedule.day_of_week;
        if (!result[day]) {
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
    const schedule = await doctorAvailabilityRepository.getDoctorScheduleByDay(id, day_of_week);
    // tra ve mang rong neu khong tim thay lich lam viec (khong phai loi)
    return schedule || [];
};

// ===== HELPERS =====

// Kiem tra 2 khoang thoi gian co chong lan nhau khong
const isOverlap = (s1, e1, s2, e2) => timeToMinutes(s1) < timeToMinutes(e2) && timeToMinutes(s2) < timeToMinutes(e1);

// Tim mau lich dang active bi chong gio voi khoang [start, end] trong cung 1 thu
const findOverlapping = (templates, day, start, end, excludeId = null) =>
    templates.find(t =>
        t.active && t.day_of_week === day && Number(t.id) !== Number(excludeId) &&
        isOverlap(start, end, t.start_time, t.end_time)
    );

const validateTimeRange = (start, end, duration) => {
    if (!start || !end) throw new ApiError(400, "Giờ bắt đầu và giờ kết thúc là bắt buộc");
    if (timeToMinutes(start) >= timeToMinutes(end)) {
        throw new ApiError(400, `Giờ bắt đầu phải nhỏ hơn giờ kết thúc (${start} - ${end})`);
    }
    if (!duration || Number(duration) <= 0) {
        throw new ApiError(400, "Thời lượng slot phải lớn hơn 0");
    }
    if (timeToMinutes(end) - timeToMinutes(start) < Number(duration)) {
        throw new ApiError(400, "Khoảng thời gian ca làm việc phải lớn hơn hoặc bằng thời lượng 1 slot");
    }
};

// Ngay xa nhat da sinh slot cua bac si (de sinh lai cho dong bo khi sua mau lich)
const getHorizonEnd = async (doctorId) => {
    const defaultEnd = addDays(todayStr(), DEFAULT_WEEKS * 7 - 1);
    const maxDate = await BookableSlot.max("slot_date", { where: { doctor_id: doctorId } });
    return maxDate && maxDate > defaultEnd ? maxDate : defaultEnd;
};

// ===== SINH SLOT TU DONG =====

/**
 * Sinh bookable_slot cho cac ngay cu the tu mau lich hang tuan (doctor_availability).
 * - Chi dung cac mau lich dang active
 * - Bo qua slot da ton tai (cung ngay + cung gio bat dau) => goi lai nhieu lan khong bi trung
 * - Khong sinh cho ngay trong qua khu
 */
const generateSlots = async (doctorId, from, to, onlyAvailabilityId = null) => {
    if (!isValidDateStr(from) || !isValidDateStr(to)) {
        throw new ApiError(400, "Ngày không hợp lệ, định dạng đúng là YYYY-MM-DD");
    }
    const today = todayStr();
    if (from < today) from = today;
    if (to < from) throw new ApiError(400, "Ngày kết thúc phải sau ngày bắt đầu (và không ở quá khứ)");
    if (diffDays(from, to) + 1 > MAX_RANGE_DAYS) {
        throw new ApiError(400, `Chỉ được tạo lịch tối đa ${MAX_RANGE_DAYS} ngày mỗi lần`);
    }

    let templates = await doctorAvailabilityRepository.getAllTemplatesByDoctor(doctorId, true);
    if (onlyAvailabilityId) templates = templates.filter(t => Number(t.id) === Number(onlyAvailabilityId));
    if (templates.length === 0) {
        return { from, to, created: 0, skipped: 0 };
    }

    // Slot da co trong khoang -> danh dau de bo qua
    const existing = await slotRepository.findSlotsInRange({ doctorId, from, to });
    const existingKeys = new Set(existing.map(s => `${s.slot_date}|${normalizeTime(s.start_time)}`));

    const newSlots = [];
    let skipped = 0;

    for (const date of eachDay(from, to)) {
        const dow = dayOfWeek(date);
        for (const t of templates.filter(x => x.day_of_week === dow)) {
            const start = timeToMinutes(t.start_time);
            const end = timeToMinutes(t.end_time);
            const step = Number(t.slot_duration_minutes);
            for (let m = start; m + step <= end; m += step) {
                const startTime = minutesToTime(m);
                const key = `${date}|${startTime}`;
                if (existingKeys.has(key)) { skipped++; continue; }
                existingKeys.add(key);
                newSlots.push({
                    doctor_id: doctorId,
                    availability_id: t.id,
                    slot_date: date,
                    start_time: startTime,
                    end_time: minutesToTime(m + step),
                    status: "available"
                });
            }
        }
    }

    if (newSlots.length > 0) {
        await slotRepository.createManySlots(newSlots);
    }

    // Sinh slot mới → xóa cache để client thấy slot mới
    invalidateCache(doctorId);

    return { from, to, created: newSlots.length, skipped };
};

// Sinh lai slot tuong lai cho 1 mau lich (sau khi sua gio / bat lai)
const regenerateForTemplate = async (template) => {
    const today = todayStr();
    await slotRepository.deleteUnbookedSlotsByAvailabilityFrom(template.id, today);
    if (!template.active) {
        // Tắt ca → slot bị xóa → xóa cache
        invalidateCache(template.doctor_id);
        return { created: 0 };
    }
    const horizonEnd = await getHorizonEnd(template.doctor_id);
    // generateSlots bên trong đã gọi invalidateCache
    return await generateSlots(template.doctor_id, today, horizonEnd, template.id);
};

// ===== CRUD MAU LICH =====

const createSchedule = async (data) => {
    // Xac thuc cac truong bat buoc
    const requireFields = ["doctor_id", "day_of_week", "start_time", "end_time", "slot_duration_minutes"];
    for (const field of requireFields) {
        if (data[field] == null || data[field] === "") {
            throw new ApiError(400, `Trường "${field}" là bắt buộc và không được để trống`);
        }
    }

    // xac thuc day_of_week
    if (!VALID_DAYS.includes(data.day_of_week)) {
        throw new ApiError(400, `Trường "day_of_week" phải là một trong các giá trị sau: ${VALID_DAYS.join(", ")}`);
    }

    // xac thuc start_time, end_time, slot_duration_minutes
    validateTimeRange(data.start_time, data.end_time, data.slot_duration_minutes);

    // active mac dinh la true
    const active = data.active === undefined ? true : Boolean(data.active);

    // khong cho phep 2 ca active chong gio trong cung 1 thu
    const templates = await doctorAvailabilityRepository.getAllTemplatesByDoctor(data.doctor_id);
    if (active) {
        const conflict = findOverlapping(templates, data.day_of_week, data.start_time, data.end_time);
        if (conflict) {
            throw new ApiError(400, `Ca này bị trùng giờ với ca ${conflict.start_time.slice(0, 5)} - ${conflict.end_time.slice(0, 5)} đã có`);
        }
    }

    const schedule = await doctorAvailabilityRepository.createSchedule({
        doctor_id: data.doctor_id,
        day_of_week: data.day_of_week,
        start_time: normalizeTime(data.start_time),
        end_time: normalizeTime(data.end_time),
        slot_duration_minutes: Number(data.slot_duration_minutes),
        active
    });

    // tu dong sinh slot cho cac tuan toi
    let slots = { created: 0 };
    if (active) {
        const horizonEnd = await getHorizonEnd(data.doctor_id);
        // generateSlots bên trong đã gọi invalidateCache
        slots = await generateSlots(data.doctor_id, todayStr(), horizonEnd, schedule.id);
    }
    return { schedule, slots };
};

/**
 * Tao nhieu ca cung luc: chon nhieu thu + nhieu khung gio (sang/chieu...)
 * body: { days: ["Monday",...], shifts: [{start_time, end_time}], slot_duration_minutes, weeks }
 */
const bulkCreateSchedules = async (doctorId, data) => {
    const { days, shifts, slot_duration_minutes } = data || {};
    const weeks = Math.min(Math.max(Number(data?.weeks) || DEFAULT_WEEKS, 1), 12);

    if (!Array.isArray(days) || days.length === 0) throw new ApiError(400, "Vui lòng chọn ít nhất 1 thứ trong tuần");
    if (!Array.isArray(shifts) || shifts.length === 0) throw new ApiError(400, "Vui lòng thêm ít nhất 1 khung giờ");
    const invalidDay = days.find(d => !VALID_DAYS.includes(d));
    if (invalidDay) throw new ApiError(400, `Thứ không hợp lệ: ${invalidDay}`);
    shifts.forEach(s => validateTimeRange(s.start_time, s.end_time, slot_duration_minutes));

    // cac khung gio gui len khong duoc chong nhau
    for (let i = 0; i < shifts.length; i++) {
        for (let j = i + 1; j < shifts.length; j++) {
            if (isOverlap(shifts[i].start_time, shifts[i].end_time, shifts[j].start_time, shifts[j].end_time)) {
                throw new ApiError(400, "Các khung giờ bạn nhập đang bị chồng lên nhau");
            }
        }
    }

    const templates = await doctorAvailabilityRepository.getAllTemplatesByDoctor(doctorId);
    const created = [];
    const skipped = [];

    for (const day of days) {
        for (const s of shifts) {
            const start = normalizeTime(s.start_time);
            const end = normalizeTime(s.end_time);
            const conflict = findOverlapping(templates, day, start, end);
            if (conflict) {
                skipped.push({ day_of_week: day, start_time: start, end_time: end, reason: "Trùng giờ với ca đã có" });
                continue;
            }
            const row = await doctorAvailabilityRepository.createSchedule({
                doctor_id: doctorId,
                day_of_week: day,
                start_time: start,
                end_time: end,
                slot_duration_minutes: Number(slot_duration_minutes),
                active: true
            });
            const plain = row.get({ plain: true });
            templates.push(plain);
            created.push(plain);
        }
    }

    // Sinh slot cho N tuan toi (bao gom ca cac mau lich cu => dong bo)
    const today = todayStr();
    const horizon = addDays(today, weeks * 7 - 1);
    // generateSlots bên trong đã gọi invalidateCache
    const slots = await generateSlots(doctorId, today, horizon);

    return { created, skipped, slots };
};

const updateSchedule = async (id, data) => {
    const schedule = await doctorAvailabilityRepository.findScheduleById(id);
    if (!schedule) {
        throw new ApiError(404, "Không tìm thấy lịch làm việc");
    }

    const next = {
        day_of_week: data.day_of_week ?? schedule.day_of_week,
        start_time: data.start_time ?? schedule.start_time,
        end_time: data.end_time ?? schedule.end_time,
        slot_duration_minutes: data.slot_duration_minutes ?? schedule.slot_duration_minutes,
        active: data.active === undefined ? Boolean(schedule.active) : Boolean(data.active)
    };

    if (!VALID_DAYS.includes(next.day_of_week)) {
        throw new ApiError(400, `Trường "day_of_week" phải là một trong các giá trị sau: ${VALID_DAYS.join(", ")}`);
    }
    // xac thuc cac truong thoi gian
    validateTimeRange(next.start_time, next.end_time, next.slot_duration_minutes);

    if (next.active) {
        const templates = await doctorAvailabilityRepository.getAllTemplatesByDoctor(schedule.doctor_id);
        const conflict = findOverlapping(templates, next.day_of_week, next.start_time, next.end_time, id);
        if (conflict) {
            throw new ApiError(400, `Ca này bị trùng giờ với ca ${conflict.start_time.slice(0, 5)} - ${conflict.end_time.slice(0, 5)} đã có`);
        }
    }

    const updated = await doctorAvailabilityRepository.updateSchedule(id, {
        ...next,
        start_time: normalizeTime(next.start_time),
        end_time: normalizeTime(next.end_time),
        slot_duration_minutes: Number(next.slot_duration_minutes)
    });

    // Dong bo slot tuong lai (slot da duoc dat se duoc giu nguyen)
    // regenerateForTemplate bên trong đã gọi invalidateCache
    const slots = await regenerateForTemplate(updated.get({ plain: true }));
    return { schedule: updated, slots };
};

const deleteSchedule = async (id) => {
    const schedule = await doctorAvailabilityRepository.findScheduleById(id);
    if (!schedule) {
        throw new ApiError(404, "Không tìm thấy lịch làm việc");
    }

    const doctorId = schedule.doctor_id;

    // Neu ca nay da co benh nhan dat lich => khong xoa han (tranh mat lich hen do FK cascade)
    // ma chuyen sang tat va don cac slot trong o tuong lai
    const bookedCount = await slotRepository.countBookedByAvailability(id);
    if (bookedCount > 0) {
        await doctorAvailabilityRepository.updateSchedule(id, { active: false });
        await slotRepository.deleteUnbookedSlotsByAvailabilityFrom(id, todayStr());
        invalidateCache(doctorId);
        return { deleted: false, disabled: true, bookedCount };
    }

    await doctorAvailabilityRepository.deleteSchedule(id);
    invalidateCache(doctorId);
    return { deleted: true, disabled: false, bookedCount: 0 };
}

const disableSchedule = async (id) => {
    const schedule = await doctorAvailabilityRepository.findScheduleById(id);
    if (!schedule) {
        throw new ApiError(404, "Không tìm thấy lịch làm việc");
    }
    await slotRepository.deleteUnbookedSlotsByAvailabilityFrom(id, todayStr());
    const result = await doctorAvailabilityRepository.updateSchedule(id, { active: false });
    invalidateCache(schedule.doctor_id);
    return result;
}

const findScheduleById = async (id) => {
    return await doctorAvailabilityRepository.findScheduleById(id);
};

// ===== QUAN LY LICH THEO NGAY (CHO BAC SI) =====

const getMyTemplates = async (doctorId) => {
    return await doctorAvailabilityRepository.getAllTemplatesByDoctor(doctorId);
};

const getMySlots = async (doctorId, from, to) => {
    if (!isValidDateStr(from) || !isValidDateStr(to)) {
        throw new ApiError(400, "Tham số from/to không hợp lệ (YYYY-MM-DD)");
    }
    if (diffDays(from, to) > MAX_RANGE_DAYS) {
        throw new ApiError(400, `Khoảng ngày tối đa ${MAX_RANGE_DAYS} ngày`);
    }
    return await slotRepository.findSlotsInRange({ doctorId, from, to });
};

// Bat/tat 1 slot (available <-> off). Khong cho sua slot da duoc dat.
const setSlotStatus = async (doctorId, slotId, status) => {
    if (!["available", "off"].includes(status)) {
        throw new ApiError(400, "Trạng thái chỉ được là 'available' hoặc 'off'");
    }
    const slot = await slotRepository.findSlotById(slotId);
    if (!slot) throw new ApiError(404, "Không tìm thấy slot");
    if (Number(slot.doctor_id) !== Number(doctorId)) throw new ApiError(403, "Bạn không có quyền");
    if (slot.status === "booked") throw new ApiError(400, "Slot đã có bệnh nhân đặt, không thể thay đổi");
    if (slot.slot_date < todayStr()) throw new ApiError(400, "Không thể thay đổi slot trong quá khứ");
    await slotRepository.updateSlotStatus(slotId, status);
    // Bật/tắt slot → xóa cache để client thấy thay đổi
    invalidateCache(doctorId);
    return { id: Number(slotId), status };
};

// Nghi ca ngay (off = true) hoac mo lai (off = false). Slot da dat giu nguyen.
const setDayOff = async (doctorId, date, off) => {
    if (!isValidDateStr(date)) throw new ApiError(400, "Ngày không hợp lệ (YYYY-MM-DD)");
    if (date < todayStr()) throw new ApiError(400, "Không thể thay đổi ngày trong quá khứ");
    const [affected] = await slotRepository.updateUnbookedSlotsByDate(doctorId, date, off ? "off" : "available");
    const daySlots = await slotRepository.findSlotsInRange({ doctorId, from: date, to: date });
    const bookedCount = daySlots.filter(s => s.status === "booked").length;
    // Nghỉ/mở ngày → xóa cache
    invalidateCache(doctorId);
    return { date, off: Boolean(off), affected, bookedCount };
};

module.exports = {
    getDoctorSchedule,
    getDoctorScheduleByDay,
    createSchedule,
    bulkCreateSchedules,
    updateSchedule,
    deleteSchedule,
    disableSchedule,
    findScheduleById,
    generateSlots,
    getMyTemplates,
    getMySlots,
    setSlotStatus,
    setDayOff
};
