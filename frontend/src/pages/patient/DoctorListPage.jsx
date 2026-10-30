import React, { useState, useEffect } from 'react';
import doctorApi from '../../api/doctorApi';
import appointmentApi from '../../api/appointmentApi';
import { formatCurrency, formatDate } from '../../utils/formatters';

// ===== MODAL ĐẶT LỊCH KHÁM =====
function BookingModal({ doctor, isOpen, onClose }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    patient_name: '',
    patient_phone: '',
    patient_email: '',
    reason_for_visit: '',
    payment_method: 'offline',
  });

  // Lấy ngày tối thiểu là ngày mai
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  useEffect(() => {
    if (!isOpen) {
      setSelectedDate('');
      setSlots([]);
      setSelectedSlot(null);
      setSuccess(null);
      setError(null);
      setForm({ patient_name: '', patient_phone: '', patient_email: '', reason_for_visit: '', payment_method: 'cash' });
    }
  }, [isOpen]);

  const fetchSlots = async (date) => {
    if (!doctor?.id || !date) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const res = await doctorApi.getAvailableSlots(doctor.id, date);
      const data = res?.data || res || [];
      setSlots(Array.isArray(data) ? data : []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    fetchSlots(date);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) { setError('Vui lòng chọn khung giờ khám'); return; }
    if (!form.patient_name.trim() || !form.patient_phone.trim()) { setError('Vui lòng nhập đầy đủ họ tên và số điện thoại'); return; }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        bookable_slot_id: selectedSlot.id,
        patient_id: null, // Bệnh nhân vãng lai - backend sẽ tạo mới nếu cần
        patient_name: form.patient_name,
        phone_number: form.patient_phone,
        email: form.patient_email,
        reason_for_visit: form.reason_for_visit || 'Khám tổng quát',
        price: doctor.price_per_appointment || 0,
        payment_method: form.payment_method,
      };
      const res = await appointmentApi.createAppointment(payload);
      const data = res?.data || res;
      setSuccess(data?.appointment_code || 'Đặt lịch thành công!');
    } catch (err) {
      setError(err?.message || 'Đặt lịch thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Đặt Lịch Khám</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Bác sĩ: <span className="font-semibold text-primary-600">{doctor?.full_name}</span>
              {doctor?.specialty && <span className="ml-1 text-slate-400">• {doctor.specialty}</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        <div className="p-6">
          {/* Thành công */}
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Đặt Lịch Thành Công!</h3>
              <p className="text-sm text-slate-500 mb-3">Mã lịch hẹn của bạn:</p>
              <div className="bg-primary-50 border border-primary-200 text-primary-700 font-mono font-bold text-lg px-4 py-2 rounded-xl inline-block mb-4">
                {success}
              </div>
              <p className="text-xs text-slate-400">Vui lòng lưu mã này để tra cứu lịch hẹn</p>
              <button
                onClick={onClose}
                className="mt-5 w-full bg-primary-600 text-white py-2.5 rounded-xl font-semibold text-sm"
              >
                Đóng
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">{error}</div>
              )}

              {/* Chọn ngày */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Ngày Khám *</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={minDateStr}
                  onChange={handleDateChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  required
                />
              </div>

              {/* Chọn giờ */}
              {selectedDate && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Khung Giờ Khám *</label>
                  {loadingSlots ? (
                    <div className="text-center text-xs text-slate-400 py-3 flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      Đang tải lịch trống...
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center text-xs text-slate-500 py-4 bg-slate-50 rounded-lg">
                      Không có lịch trống cho ngày này. Vui lòng chọn ngày khác.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`text-xs py-2 px-1 rounded-lg border font-medium transition ${
                            selectedSlot?.id === slot.id
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-primary-400 hover:bg-primary-50'
                          }`}
                        >
                          {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Thông tin bệnh nhân */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-700 uppercase mb-3">Thông Tin Bệnh Nhân</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Họ và tên *</label>
                    <input
                      type="text"
                      value={form.patient_name}
                      onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))}
                      placeholder="Nguyễn Văn A"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Số điện thoại *</label>
                    <input
                      type="tel"
                      value={form.patient_phone}
                      onChange={e => setForm(f => ({ ...f, patient_phone: e.target.value }))}
                      placeholder="0901234567"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Email (tùy chọn)</label>
                    <input
                      type="email"
                      value={form.patient_email}
                      onChange={e => setForm(f => ({ ...f, patient_email: e.target.value }))}
                      placeholder="email@example.com"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Lý do khám</label>
                    <textarea
                      value={form.reason_for_visit}
                      onChange={e => setForm(f => ({ ...f, reason_for_visit: e.target.value }))}
                      placeholder="Mô tả triệu chứng hoặc lý do khám..."
                      rows={2}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Phương thức thanh toán</label>
                    <select
                      value={form.payment_method}
                      onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                    >
                      <option value="offline">Tiền mặt tại phòng khám</option>
                      <option value="online">Chuyển khoản / thanh toán online</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tóm tắt */}
              {selectedSlot && (
                <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 text-xs">
                  <p className="font-semibold text-primary-700 mb-1">Tóm tắt lịch hẹn</p>
                  <div className="text-slate-600 space-y-0.5">
                    <p>📅 {formatDate(selectedDate)} &nbsp;⏰ {selectedSlot.start_time?.slice(0, 5)} - {selectedSlot.end_time?.slice(0, 5)}</p>
                    <p>👨‍⚕️ {doctor?.full_name}</p>
                    <p>💰 Chi phí: <span className="font-semibold text-primary-700">{formatCurrency(doctor?.price_per_appointment)}</span></p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !selectedSlot}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang đặt lịch...</>
                ) : 'Xác Nhận Đặt Lịch'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== CARD BÁC SĨ =====
function DoctorCard({ doctor, onBook }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all duration-200 flex flex-col">
      {/* Avatar */}
      <div className="bg-gradient-to-br from-primary-50 to-blue-100 h-36 flex items-center justify-center relative overflow-hidden">
        {doctor.image_url ? (
          <img src={doctor.image_url} alt={doctor.full_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center shadow-inner">
            <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
        {/* Badge chuyên khoa */}
        {doctor.specialty && (
          <span className="absolute top-3 right-3 bg-white/90 text-primary-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            {doctor.specialty}
          </span>
        )}
      </div>

      {/* Nội dung */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-slate-800 text-sm leading-tight">{doctor.full_name}</h3>
        {doctor.experience_years > 0 && (
          <p className="text-xs text-slate-500 mt-1">
            🏥 {doctor.experience_years} năm kinh nghiệm
          </p>
        )}
        {doctor.bio && (
          <p className="text-xs text-slate-500 mt-2 line-clamp-2 flex-1">{doctor.bio}</p>
        )}

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm font-bold text-primary-600">
            {formatCurrency(doctor.price_per_appointment)}
          </span>
          <span className="text-[10px] text-slate-400">/ buổi khám</span>
        </div>

        <button
          onClick={() => onBook(doctor)}
          className="mt-3 w-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold py-2.5 rounded-xl transition shadow-sm hover:shadow-md"
        >
          Đặt Lịch Khám
        </button>
      </div>
    </div>
  );
}

// ===== TRANG CHÍNH =====
export default function DoctorListPage() {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Modal đặt lịch
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [docRes, specRes] = await Promise.all([
          doctorApi.getAll(selectedSpecialty),
          doctorApi.getSpecialties(),
        ]);
        const docData = docRes?.data || docRes || [];
        const specData = specRes?.data || specRes || [];
        setDoctors(Array.isArray(docData) ? docData : []);
        setSpecialties(Array.isArray(specData) ? specData : []);
      } catch (err) {
        setError(err?.message || 'Không thể tải danh sách bác sĩ');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedSpecialty]);

  // Lọc theo từ khóa tìm kiếm
  const filteredDoctors = doctors.filter(d =>
    d.full_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    d.specialty?.toLowerCase().includes(searchText.toLowerCase()) ||
    d.bio?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleBook = (doctor) => {
    setBookingDoctor(doctor);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Danh Sách Bác Sĩ</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tìm kiếm bác sĩ phù hợp và đặt lịch khám ngay hôm nay
          </p>
        </div>
        {!loading && (
          <span className="bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
            {filteredDoctors.length} bác sĩ
          </span>
        )}
      </div>

      {/* Thanh tìm kiếm + lọc chuyên khoa */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Tìm bác sĩ theo tên, chuyên khoa..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Bộ lọc chuyên khoa */}
        {specialties.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSpecialty(null)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                !selectedSpecialty
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-primary-50 hover:text-primary-700'
              }`}
            >
              Tất cả
            </button>
            {specialties.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSpecialty(selectedSpecialty === s.id ? null : s.id)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                  selectedSpecialty === s.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-primary-50 hover:text-primary-700'
                }`}
              >
                {s.specialty_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nội dung */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden animate-pulse">
              <div className="h-36 bg-slate-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-8 bg-slate-100 rounded mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm font-medium">Không tìm thấy bác sĩ nào</p>
          <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          <button
            onClick={() => { setSearchText(''); setSelectedSpecialty(null); }}
            className="mt-3 text-xs text-primary-600 hover:underline font-semibold"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDoctors.map(doctor => (
            <DoctorCard key={doctor.id} doctor={doctor} onBook={handleBook} />
          ))}
        </div>
      )}

      {/* Modal đặt lịch */}
      <BookingModal
        doctor={bookingDoctor}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setBookingDoctor(null); }}
      />
    </div>
  );
}
