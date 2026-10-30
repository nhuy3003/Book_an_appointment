// Tiện ích xử lý ngày/giờ dạng chuỗi (tránh lệch múi giờ khi dùng Date object)

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const pad = (n) => String(n).padStart(2, "0");

// Ngày hôm nay theo giờ máy chủ: "YYYY-MM-DD"
const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Giờ hiện tại: "HH:mm:ss"
const nowTimeStr = () => {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const isValidDateStr = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));

// Cộng thêm n ngày vào chuỗi ngày
const addDays = (dateStr, n) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + n));
    return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
};

// Tên thứ (Monday...) của một ngày
const dayOfWeek = (dateStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return DAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
};

// Số ngày giữa 2 ngày (to - from)
const diffDays = (from, to) => {
    const a = Date.parse(`${from}T00:00:00Z`);
    const b = Date.parse(`${to}T00:00:00Z`);
    return Math.round((b - a) / 86400000);
};

// Danh sách ngày từ from đến to (bao gồm cả 2 đầu)
const eachDay = (from, to) => {
    const days = [];
    for (let cur = from; cur <= to; cur = addDays(cur, 1)) days.push(cur);
    return days;
};

// "08:30" | "08:30:00" -> 510 (phút)
const timeToMinutes = (t) => {
    const [h, m] = String(t).split(":").map(Number);
    return h * 60 + (m || 0);
};

// 510 -> "08:30:00"
const minutesToTime = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}:00`;

// Chuẩn hóa "8:30" | "08:30" | "08:30:00" -> "08:30:00"
const normalizeTime = (t) => minutesToTime(timeToMinutes(t));

module.exports = {
    DAY_NAMES,
    todayStr,
    nowTimeStr,
    isValidDateStr,
    addDays,
    dayOfWeek,
    diffDays,
    eachDay,
    timeToMinutes,
    minutesToTime,
    normalizeTime
};
