import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import doctorAvailabilityApi from '../../api/doctorAvailabilityApi';
import ScheduleModal from '../../components/doctor/ScheduleModal';
import { formatDate, formatTime } from '../../utils/formatters';

const DAYS_OF_WEEK = [
  { value: 'Monday', label: 'Thứ Hai' },
  { value: 'Tuesday', label: 'Thứ Ba' },
  { value: 'Wednesday', label: 'Thứ Tư' },
  { value: 'Thursday', label: 'Thứ Năm' },
  { value: 'Friday', label: 'Thứ Sáu' },
  { value: 'Saturday', label: 'Thứ Bảy' },
  { value: 'Sunday', label: 'Chủ Nhật' },
];

const SHIFT_PRESETS = [
  { id: 'morning', label: 'Sáng 08:00 – 12:00', start_time: '08:00', end_time: '12:00' },
  { id: 'afternoon', label: 'Chiều 13:30 – 17:00', start_time: '13:30', end_time: '17:00' },
  { id: 'evening', label: 'Tối 18:00 – 21:00', start_time: '18:00', end_time: '21:00' },
];

const pad = (n) => String(n).padStart(2, '0');

const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const startOfWeek = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
};

const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

const todayISO = () => toISODate(new Date());

export default function DoctorSchedulePage() {
  const { doctor, socket } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [slots, setSlots] = useState([]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const [selectedDays, setSelectedDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [selectedShifts, setSelectedShifts] = useState(['morning', 'afternoon']);
  const [duration, setDuration] = useState(30);
  const [weeks, setWeeks] = useState(4);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => toISODate(addDays(weekStart, i))),
    [weekStart]
  );
  const today = todayISO();

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tplRes, slotRes] = await Promise.all([
        doctorAvailabilityApi.getMyTemplates(),
        doctorAvailabilityApi.getMySlots(weekDates[0], weekDates[6]),
      ]);
      setTemplates(Array.isArray(tplRes?.data) ? tplRes.data : []);
      setSlots(Array.isArray(slotRes?.data) ? slotRes.data : []);
    } catch (err) {
      setError(err?.message || 'Không thể tải lịch làm việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDates[0], weekDates[6]]);

  // Lắng nghe sự kiện ca hẹn mới qua Socket để chuyển slot sang 'booked' tức thì
  useEffect(() => {
    if (!socket) return;

    const handleNewAppointment = (data) => {
      const bookedSlotId = data?.bookableSlotId || data?.slot?.id;
      if (bookedSlotId) {
        setSlots((prevSlots) =>
          prevSlots.map((s) => (s.id === bookedSlotId ? { ...s, status: 'booked' } : s))
        );
      }
    };

    socket.on('appointment:new', handleNewAppointment);

    return () => {
      socket.off('appointment:new', handleNewAppointment);
    };
  }, [socket]);

  const slotsByDate = useMemo(() => {
    const map = {};
    weekDates.forEach((d) => { map[d] = []; });
    slots.forEach((s) => {
      if (!map[s.slot_date]) map[s.slot_date] = [];
      map[s.slot_date].push(s);
    });
    return map;
  }, [slots, weekDates]);

  const templatesByDay = useMemo(() => {
    const map = {};
    DAYS_OF_WEEK.forEach((d) => { map[d.value] = []; });
    templates.forEach((t) => {
      if (!map[t.day_of_week]) map[t.day_of_week] = [];
      map[t.day_of_week].push(t);
    });
    return map;
  }, [templates]);

  const toggleDay = (value) => {
    setSelectedDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    );
  };

  const toggleShift = (id) => {
    setSelectedShifts((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleBulkCreate = async () => {
    if (selectedDays.length === 0) {
      setError('Vui lòng chọn ít nhất 1 thứ trong tuần');
      return;
    }
    const shifts = SHIFT_PRESETS.filter((s) => selectedShifts.includes(s.id)).map((s) => ({
      start_time: s.start_time,
      end_time: s.end_time,
    }));
    if (shifts.length === 0) {
      setError('Vui lòng chọn ít nhất 1 khung giờ (sáng / chiều / tối)');
      return;
    }

    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const res = await doctorAvailabilityApi.bulkCreate({
        days: selectedDays,
        shifts,
        slot_duration_minutes: Number(duration),
        weeks: Number(weeks),
      });
      setInfo(res?.message || 'Đã tạo lịch và sinh khung giờ khám theo ngày');
      await fetchAll();
    } catch (err) {
      setError(err?.message || 'Không tạo được lịch nhanh');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateMore = async () => {
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const from = today;
      const toDate = addDays(new Date(), Number(weeks) * 7 - 1);
      const res = await doctorAvailabilityApi.generateSlots(from, toISODate(toDate));
      setInfo(res?.message || 'Đã sinh thêm khung giờ khám');
      await fetchAll();
    } catch (err) {
      setError(err?.message || 'Không sinh được khung giờ');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchedule = async (formData) => {
    if (editingSchedule?.id) {
      await doctorAvailabilityApi.update(editingSchedule.id, formData);
    } else {
      await doctorAvailabilityApi.create(formData);
    }
    setInfo('Đã lưu ca làm việc và cập nhật lịch theo ngày');
    await fetchAll();
  };

  const handleDeleteSchedule = async (idCalendar) => {
    if (!window.confirm('Xóa ca này? Các khung giờ chưa có người đặt cũng sẽ bị gỡ.')) return;
    try {
      const res = await doctorAvailabilityApi.delete(idCalendar);
      setInfo(res?.message || 'Đã xóa ca làm việc');
      await fetchAll();
    } catch (err) {
      alert(err?.message || 'Lỗi khi xóa ca làm việc');
    }
  };

  const handleToggleTemplate = async (item) => {
    try {
      await doctorAvailabilityApi.update(item.id, { active: !item.active });
      await fetchAll();
    } catch (err) {
      alert(err?.message || 'Lỗi khi cập nhật ca');
    }
  };

  const handleDayOff = async (date, off) => {
    if (date < today) return;
    try {
      const res = await doctorAvailabilityApi.setDayOff(date, off);
      setInfo(res?.message || (off ? `Đã nghỉ ngày ${formatDate(date)}` : `Đã mở lại ${formatDate(date)}`));
      await fetchAll();
    } catch (err) {
      alert(err?.message || 'Không đổi được trạng thái ngày');
    }
  };

  const handleToggleSlot = async (slot) => {
    if (slot.status === 'booked' || slot.slot_date < today) return;
    const next = slot.status === 'off' ? 'available' : 'off';
    try {
      await doctorAvailabilityApi.setSlotStatus(slot.id, next);
      setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, status: next } : s)));
    } catch (err) {
      alert(err?.message || 'Không đổi được khung giờ');
    }
  };

  const slotClass = (status) => {
    if (status === 'booked') return 'bg-blue-100 text-blue-800 border-blue-200 cursor-default';
    if (status === 'off') return 'bg-slate-100 text-slate-400 border-slate-200 line-through';
    return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Lịch làm việc theo ngày</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Chọn thứ + ca làm việc một lần, hệ thống tự sinh khung giờ có ngày tháng để bệnh nhân đặt.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSchedule(null);
            setIsModalOpen(true);
          }}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition"
        >
          + Thêm 1 ca lẻ
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Tạo lịch nhanh</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Ví dụ: Thứ 2–6, sáng và chiều, 30 phút/bệnh nhân, sinh 4 tuần tới.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-slate-600 uppercase mb-2">Ngày trong tuần</p>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const on = selectedDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    on ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-slate-600 uppercase mb-2">Khung giờ</p>
          <div className="flex flex-wrap gap-2">
            {SHIFT_PRESETS.map((shift) => {
              const on = selectedShifts.includes(shift.id);
              return (
                <button
                  key={shift.id}
                  type="button"
                  onClick={() => toggleShift(shift.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    on ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {shift.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <label className="text-xs text-slate-600">
            Thời lượng mỗi ca
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-1 block border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {[15, 20, 30, 45, 60].map((m) => (
                <option key={m} value={m}>{m} phút</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-600">
            Sinh lịch trong
            <select
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
              className="mt-1 block border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {[2, 4, 6, 8, 12].map((w) => (
                <option key={w} value={w}>{w} tuần</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={handleBulkCreate}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-xs font-semibold px-5 py-2.5 rounded-xl"
          >
            {saving ? 'Đang tạo...' : 'Tạo lịch & sinh khung giờ'}
          </button>
          <button
            type="button"
            disabled={saving || templates.length === 0}
            onClick={handleGenerateMore}
            className="border border-primary-200 text-primary-700 hover:bg-primary-50 disabled:opacity-50 text-xs font-semibold px-4 py-2.5 rounded-xl"
          >
            Sinh thêm khung giờ
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">{error}</div>
      )}
      {info && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">{info}</div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3">
          <h2 className="text-sm font-bold text-slate-800">Lịch theo ngày (tuần này)</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekStart((d) => addDays(d, -7))}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              ← Tuần trước
            </button>
            <button
              type="button"
              onClick={() => setWeekStart(startOfWeek(new Date()))}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Tuần hiện tại
            </button>
            <button
              type="button"
              onClick={() => setWeekStart((d) => addDays(d, 7))}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Tuần sau →
            </button>
          </div>
        </div>

        <div className="px-4 py-2 text-[11px] text-slate-500 flex flex-wrap gap-3 border-b border-slate-100">
          <span><span className="inline-block w-2.5 h-2.5 rounded bg-emerald-400 mr-1" /> Trống — bấm để nghỉ</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded bg-blue-400 mr-1" /> Đã đặt</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded bg-slate-300 mr-1" /> Nghỉ — bấm để mở lại</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Đang tải lịch theo ngày...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {weekDates.map((date) => {
              const daySlots = slotsByDate[date] || [];
              const isPast = date < today;
              const booked = daySlots.filter((s) => s.status === 'booked').length;
              const available = daySlots.filter((s) => s.status === 'available').length;
              const weekday = DAYS_OF_WEEK[weekDates.indexOf(date)]?.label;
              return (
                <div key={date} className={`p-3 min-h-[180px] ${date === today ? 'bg-primary-50/40' : ''} ${isPast ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">{weekday}</p>
                      <p className="text-sm font-bold text-slate-800">{formatDate(date)}</p>
                      <p className="text-[10px] text-slate-400">{available} trống · {booked} đã đặt</p>
                    </div>
                    {!isPast && daySlots.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleDayOff(date, available > 0)}
                        className="text-[10px] font-semibold text-rose-600 hover:underline"
                      >
                        {available > 0 ? 'Nghỉ ngày' : 'Mở lại'}
                      </button>
                    )}
                  </div>
                  {daySlots.length === 0 ? (
                    <p className="text-[11px] text-slate-400">Chưa có khung giờ</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {daySlots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={slot.status === 'booked' || isPast}
                          onClick={() => handleToggleSlot(slot)}
                          className={`text-[10px] px-1.5 py-1 rounded border text-left ${slotClass(slot.status)}`}
                          title={slot.status === 'booked' ? 'Đã có bệnh nhân đặt' : 'Bấm để bật/tắt'}
                        >
                          {formatTime(slot.start_time)}
                          {slot.status === 'booked' ? ' · đặt' : slot.status === 'off' ? ' · nghỉ' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">Mẫu lịch hàng tuần</h2>
          <p className="text-[11px] text-slate-500">Các ca lặp lại mỗi tuần. Sửa ở đây sẽ cập nhật các ngày chưa có người đặt.</p>
        </div>
        {templates.length === 0 ? (
          <p className="p-8 text-center text-xs text-slate-400">Chưa có mẫu lịch. Dùng “Tạo lịch nhanh” phía trên.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.value} className="px-6 py-3 flex flex-wrap items-center gap-3">
                <span className="w-24 text-xs font-bold text-slate-700">{day.label}</span>
                {(templatesByDay[day.value] || []).length === 0 ? (
                  <span className="text-[11px] text-slate-400">Nghỉ</span>
                ) : (
                  (templatesByDay[day.value] || []).map((item) => (
                    <div key={item.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs font-semibold text-slate-800">
                        {formatTime(item.start_time)} – {formatTime(item.end_time)}
                      </span>
                      <span className="text-[10px] text-slate-500">{item.slot_duration_minutes}p</span>
                      <button
                        type="button"
                        onClick={() => handleToggleTemplate(item)}
                        className={`text-[10px] font-semibold ${item.active ? 'text-emerald-600' : 'text-slate-400'}`}
                      >
                        {item.active ? 'Bật' : 'Tắt'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSchedule(item);
                          setIsModalOpen(true);
                        }}
                        className="text-[10px] text-primary-600 font-semibold"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSchedule(item.id)}
                        className="text-[10px] text-rose-600 font-semibold"
                      >
                        Xóa
                      </button>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
