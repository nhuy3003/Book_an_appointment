const doctorRepository = require("../repositories/doctor.repository");
const slotRepository = require("../repositories/bookable_slot.repository");
const specialtyRepository = require("../repositories/specialty.repository");
const ApiError = require("../utils/ApiError");
const { todayStr, nowTimeStr, addDays, isValidDateStr, diffDays } = require("../utils/dateHelper");

const AVAILABILITY_WINDOW_DAYS = 14; // so ngay toi hien thi lich trong cho benh nhan

const getDoctorById = async (doctorId) => {

  const doctor = await doctorRepository.findDoctorById(doctorId);

  if (!doctor) {
    throw new ApiError(404, "Không tìm thấy bác sĩ");
  }
  const result = {
    ...doctor.toJSON(),
    specialty: doctor.Specialty?.specialty_name,
  };
  
  delete result.Specialty;
  delete result.password

  return result;

};

// Lọc bỏ các slot đã qua giờ (nếu là hôm nay)
const filterPastSlots = (slots) => {
  const today = todayStr();
  const now = nowTimeStr();
  return slots.filter(s => s.slot_date > today || (s.slot_date === today && s.start_time > now));
};

// Lấy tất cả bác sĩ (công khai - dành cho bệnh nhân)
// Kèm thông tin lịch trống: số slot còn trống trong 14 ngày tới, ngày trống gần nhất.
// Nếu truyền date => chỉ trả về bác sĩ còn slot trống trong ngày đó.
const getAllDoctors = async (specialtyId = null, date = null) => {
  const doctors = await doctorRepository.findAllDoctors(specialtyId);
  if (doctors.length === 0) return [];

  const today = todayStr();
  const from = today;
  let to = addDays(today, AVAILABILITY_WINDOW_DAYS - 1);
  if (date && isValidDateStr(date) && date > to) to = date;

  const slots = filterPastSlots(await slotRepository.findSlotsInRange({
    doctorIds: doctors.map(d => d.id),
    from,
    to,
    status: "available"
  }));

  // Gom nhóm theo bác sĩ
  const stats = {};
  for (const s of slots) {
    const st = stats[s.doctor_id] || (stats[s.doctor_id] = { count: 0, dates: {} });
    st.count++;
    st.dates[s.slot_date] = (st.dates[s.slot_date] || 0) + 1;
  }

  let result = doctors.map(d => {
    const st = stats[d.id] || { count: 0, dates: {} };
    const sortedDates = Object.keys(st.dates).sort();
    const next = sortedDates[0] || null;
    return {
      ...d.toJSON(),
      specialty: d.Specialty?.specialty_name,
      specialty_id: d.Specialty?.id,
      available_slots_count: st.count,
      available_days_count: sortedDates.length,
      next_available_date: next,
      next_available_slots: next ? st.dates[next] : 0,
      slots_on_date: date ? (st.dates[date] || 0) : undefined
    };
  });

  if (date) {
    result = result.filter(d => d.slots_on_date > 0);
  }

  // Bác sĩ có lịch trống sớm hơn hiển thị trước
  result.sort((a, b) => {
    if (!a.next_available_date && !b.next_available_date) return a.full_name.localeCompare(b.full_name);
    if (!a.next_available_date) return 1;
    if (!b.next_available_date) return -1;
    return a.next_available_date.localeCompare(b.next_available_date) || b.available_slots_count - a.available_slots_count;
  });

  return result;
};

// Lấy tất cả chuyên khoa (công khai)
const getAllSpecialties = async () => {
  return await specialtyRepository.findAllSpecialties();
};

// Lấy slot khả dụng của bác sĩ theo ngày (ẩn slot đã qua giờ)
const getAvailableSlots = async (doctorId, date) => {
  if (!isValidDateStr(date) || date < todayStr()) return [];
  const slots = await slotRepository.findAvailableSlotsByDoctorAndDate(doctorId, date);
  return filterPastSlots(slots.map(s => s.toJSON()));
};

// Lấy danh sách ngày còn slot trống của bác sĩ (mặc định 14 ngày tới)
const getAvailableDates = async (doctorId, from = null, to = null) => {
  const today = todayStr();
  if (!from || !isValidDateStr(from) || from < today) from = today;
  if (!to || !isValidDateStr(to)) to = addDays(from, AVAILABILITY_WINDOW_DAYS - 1);
  if (diffDays(from, to) > 92) to = addDays(from, 92);
  if (to < from) return [];

  const slots = filterPastSlots(await slotRepository.findSlotsInRange({
    doctorId, from, to, status: "available"
  }));

  const map = {};
  for (const s of slots) map[s.slot_date] = (map[s.slot_date] || 0) + 1;
  return Object.keys(map).sort().map(date => ({ date, available: map[date] }));
};

const updateProfile = async (doctorId, data) => {
  const allowedFields = [
    "full_name",
    "phone_number",
    "address",
    "image_url",
    "experience_years",
    "bio"
  ];

  const filteredData = {};

  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      filteredData[field] = data[field];
    }
  });

  if (Object.keys(filteredData).length === 0) {
    throw new Error("Không có dữ liệu hợp lệ để cập nhật");
  }

  await doctorRepository.updateDoctor(doctorId, filteredData);
};

module.exports = {
  getDoctorById,
  getAllDoctors,
  getAllSpecialties,
  getAvailableSlots,
  getAvailableDates,
  updateProfile
};