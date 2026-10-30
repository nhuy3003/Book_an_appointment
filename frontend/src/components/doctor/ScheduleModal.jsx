import React, { useState, useEffect } from 'react';

const DAYS_OF_WEEK = [
  { value: 'Monday', label: 'Thứ Hai' },
  { value: 'Tuesday', label: 'Thứ Ba' },
  { value: 'Wednesday', label: 'Thứ Tư' },
  { value: 'Thursday', label: 'Thứ Năm' },
  { value: 'Friday', label: 'Thứ Sáu' },
  { value: 'Saturday', label: 'Thứ Bảy' },
  { value: 'Sunday', label: 'Chủ Nhật' },
];

export default function ScheduleModal({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    day_of_week: 'Monday',
    start_time: '08:00',
    end_time: '12:00',
    slot_duration_minutes: 30,
    active: true,
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        day_of_week: initialData.day_of_week || 'Monday',
        start_time: initialData.start_time?.slice(0, 5) || '08:00',
        end_time: initialData.end_time?.slice(0, 5) || '12:00',
        slot_duration_minutes: initialData.slot_duration_minutes || 30,
        active: initialData.active !== undefined ? initialData.active : true,
      });
    } else {
      setFormData({
        day_of_week: 'Monday',
        start_time: '08:00',
        end_time: '12:00',
        slot_duration_minutes: 30,
        active: true,
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation cơ bản
    if (formData.start_time >= formData.end_time) {
      setError('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
      return;
    }
    if (formData.slot_duration_minutes <= 0) {
      setError('Thời lượng một ca khám phải lớn hơn 0 phút');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err?.message || err?.error || 'Có lỗi xảy ra khi lưu ca làm việc');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {initialData ? 'Chỉnh Sửa Ca Làm Việc' : 'Thêm Ca Làm Việc Mới'}
          </h2>
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

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Thứ Trong Tuần
            </label>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 bg-white"
            >
              {DAYS_OF_WEEK.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label} ({day.value})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giờ Bắt Đầu
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giờ Kết Thúc
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Thời Lượng Khám Mỗi Ca (Phút)
            </label>
            <input
              type="number"
              min="10"
              max="120"
              step="5"
              value={formData.slot_duration_minutes}
              onChange={(e) =>
                setFormData({ ...formData, slot_duration_minutes: Number(e.target.value) })
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Hệ thống tự chia thành các khung giờ có ngày tháng cụ thể để bệnh nhân đặt.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
            />
            <label htmlFor="active" className="text-xs font-medium text-slate-700">
              Kích hoạt ca làm việc này (Active)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : initialData ? 'Cập Nhật Ca' : 'Tạo Ca Mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

