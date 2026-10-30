// Định dạng tiền tệ VND: 250000 -> 250.000 ₫
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Định dạng ngày: YYYY-MM-DD -> DD/MM/YYYY (không lệch múi giờ)
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const s = String(dateString).slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return new Date(dateString).toLocaleDateString('vi-VN');
};

export const formatTime = (timeString) => {
  if (!timeString) return '';
  return String(timeString).slice(0, 5);
};

export const WEEKDAY_LABELS = {
  Monday: 'Thứ Hai',
  Tuesday: 'Thứ Ba',
  Wednesday: 'Thứ Tư',
  Thursday: 'Thứ Năm',
  Friday: 'Thứ Sáu',
  Saturday: 'Thứ Bảy',
  Sunday: 'Chủ Nhật',
};

// Badge màu cho các trạng thái Appointment trong database
export const getAppointmentStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return { label: 'Chờ duyệt', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' };
    case 'confirmed':
      return { label: 'Đã xác nhận', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
    case 'completed':
      return { label: 'Đã khám', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' };
    case 'cancelled':
      return { label: 'Đã hủy', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' };
    case 'missed':
      return { label: 'Bỏ hẹn', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' };
    default:
      return { label: status || 'Không rõ', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
  }
};

