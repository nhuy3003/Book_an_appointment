import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import doctorAvailabilityApi from '../../api/doctorAvailabilityApi';
import ScheduleModal from '../../components/doctor/ScheduleModal';

const DAYS_OF_WEEK = [
  { value: 'Monday', label: 'Thứ Hai' },
  { value: 'Tuesday', label: 'Thứ Ba' },
  { value: 'Wednesday', label: 'Thứ Tư' },
  { value: 'Thursday', label: 'Thứ Năm' },
  { value: 'Friday', label: 'Thứ Sáu' },
  { value: 'Saturday', label: 'Thứ Bảy' },
  { value: 'Sunday', label: 'Chủ Nhật' },
];

export default function DoctorSchedulePage() {
  const { doctor } = useAuth();
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State cho Modal thêm/sửa ca
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // Lấy lịch làm việc theo thứ đã chọn
  const fetchSchedules = async () => {
    if (!doctor?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await doctorAvailabilityApi.getByDay(doctor.id, selectedDay);
      // Backend trả về: { success: true, data: [...], message: "..." }
      const data = res.data || res || [];
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Không thể tải lịch làm việc của ngày đã chọn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [doctor?.id, selectedDay]);

  // Thêm hoặc Cập nhật ca làm việc
  const handleSaveSchedule = async (formData) => {
    if (editingSchedule?.id) {
      await doctorAvailabilityApi.update(editingSchedule.id, formData);
    } else {
      await doctorAvailabilityApi.create({
        ...formData,
        doctor_id: doctor?.id,
      });
    }
    // Refresh lại danh sách
    fetchSchedules();
  };

  // Bật / Tắt trạng thái hoạt động của ca
  const handleToggleActive = async (item) => {
    try {
      await doctorAvailabilityApi.update(item.id, {
        active: !item.active,
      });
      fetchSchedules();
    } catch (err) {
      alert(err?.message || 'Lỗi khi cập nhật trạng thái ca');
    }
  };

  // Xóa ca làm việc
  const handleDeleteSchedule = async (idCalendar) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ca làm việc này?')) return;
    try {
      await doctorAvailabilityApi.delete(idCalendar);
      fetchSchedules();
    } catch (err) {
      alert(err?.message || 'Lỗi khi xóa ca làm việc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header trang */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Quản Lý Lịch Làm Việc (Doctor Availability)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình thời gian làm việc hàng tuần cho Bác sĩ {doctor?.full_name || ''}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingSchedule(null);
            setIsModalOpen(true);
          }}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Thêm Ca Làm Việc</span>
        </button>
      </div>

      {/* Tabs chọn thứ trong tuần */}
      <div className="flex overflow-x-auto gap-2 pb-1 border-b border-slate-200">
        {DAYS_OF_WEEK.map((day) => {
          const isActive = selectedDay === day.value;
          return (
            <button
              key={day.value}
              onClick={() => setSelectedDay(day.value)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {day.label}
            </button>
          );
        })}
      </div>

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Bảng danh sách ca khám */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-800">
            Lịch Làm Việc - {DAYS_OF_WEEK.find((d) => d.value === selectedDay)?.label} ({selectedDay})
          </h2>
          <span className="text-xs text-slate-500">
            Tổng cộng: <strong className="text-slate-800">{schedules.length}</strong> ca khám
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            Đang tải dữ liệu ca khám...
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <p className="mb-2 text-sm">Chưa có ca làm việc nào được cấu hình cho ngày này.</p>
            <button
              onClick={() => {
                setEditingSchedule({ day_of_week: selectedDay });
                setIsModalOpen(true);
              }}
              className="text-primary-600 hover:underline font-semibold"
            >
              + Tạo ca làm việc ngay
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Khung Giờ</th>
                  <th className="px-6 py-3">Thời Lượng Khám</th>
                  <th className="px-6 py-3">Trạng Thái</th>
                  <th className="px-6 py-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-primary-500"></span>
                        <span>
                          {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium text-[11px]">
                        {item.slot_duration_minutes || 30} phút / bệnh nhân
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                          item.active !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                        title="Bấm để bật/tắt trạng thái"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.active !== false ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        ></span>
                        {item.active !== false ? 'Đang hoạt động' : 'Tạm tắt'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingSchedule(item);
                          setIsModalOpen(true);
                        }}
                        className="text-primary-600 hover:text-primary-800 font-medium px-2 py-1 rounded hover:bg-primary-50"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(item.id)}
                        className="text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded hover:bg-rose-50"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Thêm / Chỉnh Sửa Ca Làm Việc */}
      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSchedule(null);
        }}
        onSubmit={handleSaveSchedule}
        initialData={editingSchedule}
      />
    </div>
  );
}
