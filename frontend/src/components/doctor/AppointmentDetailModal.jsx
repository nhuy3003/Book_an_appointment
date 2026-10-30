import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate, getAppointmentStatusBadge } from '../../utils/formatters';

export default function AppointmentDetailModal({ isOpen, onClose, appointment, onUpdateStatus }) {
  const [status, setStatus] = useState(appointment?.status || 'pending');
  const [note, setNote] = useState(appointment?.note || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (appointment) {
      setStatus(appointment.status || 'pending');
      setNote(appointment.note || '');
      setError(null);
    }
  }, [appointment]);

  if (!isOpen || !appointment) return null;

  const currentBadge = getAppointmentStatusBadge(appointment.status);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onUpdateStatus(appointment.id, { status, note });
      onClose();
    } catch (err) {
      setError(err?.message || 'Lỗi khi cập nhật lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Chi Tiết Lịch Hẹn #{appointment.appointment_code}
            </h2>
            <span className="text-[11px] text-slate-400">
              Ngày tạo: {formatDate(appointment.created_at)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 text-sm"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-4 text-xs text-slate-600">
          {/* Thông tin Bệnh nhân */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
              Thông Tin Bệnh Nhân
            </h3>
            <p>
              <strong className="text-slate-700">Họ và tên:</strong>{' '}
              {appointment.Patient?.full_name || 'Khách vãng lai'}
            </p>
            <p>
              <strong className="text-slate-700">Số điện thoại:</strong>{' '}
              {appointment.Patient?.phone_number || 'Chưa cung cấp'}
            </p>
            <p>
              <strong className="text-slate-700">Email:</strong>{' '}
              {appointment.Patient?.email || 'Chưa cung cấp'}
            </p>
            <p>
              <strong className="text-slate-700">Địa chỉ:</strong>{' '}
              {appointment.Patient?.address || 'Chưa cung cấp'}
            </p>
            <p>
              <strong className="text-slate-700">Lý do khám:</strong>{' '}
              <span className="text-slate-900 font-medium">
                {appointment.reason_for_visit || 'Không có mô tả'}
              </span>
            </p>
          </div>

          {/* Thông tin Ca khám & Chi phí */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-semibold">Ngày hẹn khám</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5">
                {appointment.BookableSlot?.slot_date
                  ? formatDate(appointment.BookableSlot.slot_date)
                  : 'N/A'}
              </p>
              <p className="text-primary-600 font-semibold text-xs mt-0.5">
                {appointment.BookableSlot?.start_time?.slice(0, 5)} -{' '}
                {appointment.BookableSlot?.end_time?.slice(0, 5)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-semibold">Chi phí khám</p>
              <p className="font-bold text-emerald-600 text-sm mt-0.5">
                {formatCurrency(appointment.price)}
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5 capitalize">
                Hình thức: {appointment.payment_method || 'Offline'} (
                {appointment.payment_status || 'Pending'})
              </p>
            </div>
          </div>

          {/* Form Cập nhật Trạng thái & Ghi chú */}
          <form onSubmit={handleSave} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trạng Thái Ca Hẹn
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-primary-500 bg-white"
              >
                <option value="pending">Chờ duyệt (Pending)</option>
                <option value="confirmed">Đã xác nhận (Confirmed)</option>
                <option value="completed">Đã khám bệnh xong (Completed)</option>
                <option value="cancelled">Hủy lịch hẹn (Cancelled)</option>
                <option value="missed">Bệnh nhân bỏ hẹn (Missed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ghi Chú Của Bác Sĩ (Lời dặn / Toa thuốc / Kết luận)
              </label>
              <textarea
                rows="3"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú sau khi khám cho bệnh nhân..."
                className="w-full border border-slate-300 rounded-lg p-3 text-xs focus:outline-none focus:border-primary-500"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

