import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaBriefcase,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaVenusMars,
  FaBirthdayCake,
  FaNotesMedical,
  FaCreditCard,
  FaCheckCircle,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { USE_MOCK, mockDoctors, generateMockSlots } from '../data/mockData';
import { doctorApi, slotApi, appointmentApi } from '../api/apiServices';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getNext7Days() {
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const days = [];
  const today = new Date();

  for (let i = 0; days.length < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === 0) continue; // skip Sunday
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    days.push({
      dateStr: `${yyyy}-${mm}-${dd}`,
      dayName: dayNames[d.getDay()],
      dayNum: d.getDate(),
      month: d.getMonth() + 1,
    });
  }
  return days;
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr.slice(0, 5); // '08:00:00' → '08:00'
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatPrice(price) {
  if (price == null) return '';
  return price.toLocaleString('vi-VN') + 'đ';
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function DoctorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [patientForm, setPatientForm] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    gender: '',
    date_of_birth: '',
    reason_for_visit: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('offline');

  const next7Days = getNext7Days();

  // ── Fetch doctor ────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchDoctor() {
      setLoading(true);
      try {
        if (USE_MOCK) {
          const found = mockDoctors.find((d) => String(d.id) === String(id));
          setDoctor(found || null);
          if (found) {
            const mockSlots = generateMockSlots(found.id);
            setSlots(mockSlots);
          }
        } else {
          const res = await doctorApi.getById(id);
          setDoctor(res.data ?? res);
        }
      } catch (err) {
        toast.error('Không thể tải thông tin bác sĩ');
      } finally {
        setLoading(false);
      }
    }
    fetchDoctor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Fetch slots when date changes (API mode) ───────────────────────────
  useEffect(() => {
    if (!selectedDate || !doctor) return;
    if (USE_MOCK) return; // already loaded
    async function fetchSlots() {
      try {
        const res = await slotApi.getAvailable(doctor.id, selectedDate);
        setSlots(res.data ?? res);
      } catch {
        setSlots([]);
      }
    }
    fetchSlots();
  }, [selectedDate, doctor]);

  // Select first available date on mount
  useEffect(() => {
    if (next7Days.length > 0 && !selectedDate) {
      setSelectedDate(next7Days[0].dateStr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived: filtered slots for selected date ───────────────────────────
  const filteredSlots = slots.filter((s) => {
    const matchDate = s.date === selectedDate || s.slot_date === selectedDate;
    const isAvailable = s.status === 'available';
    return matchDate && isAvailable;
  });

  // ── Form helpers ────────────────────────────────────────────────────────
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPatientForm((prev) => ({ ...prev, [name]: value }));
  };

  const isStep2Valid =
    patientForm.full_name.trim() !== '' &&
    patientForm.phone_number.trim() !== '' &&
    patientForm.reason_for_visit.trim() !== '';

  // ── Submit booking ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 1500));
        toast.success('Đặt lịch khám thành công!');
        navigate('/booking-success', {
          state: {
            appointmentCode: 'APT001',
            doctorName: doctor.full_name,
            date: formatDate(selectedDate),
            time: `${formatTime(selectedSlot.start_time)} - ${formatTime(selectedSlot.end_time)}`,
          },
        });
      } else {
        await appointmentApi.create({
          bookable_slot_id: selectedSlot.id,
          patient_id: null,
          reason_for_visit: patientForm.reason_for_visit,
          price: doctor.price_per_appointment,
          payment_method: paymentMethod,
          note: '',
        });
        toast.success('Đặt lịch khám thành công!');
        navigate('/booking-success');
      }
    } catch (error) {
      toast.error(error.message || 'Đã xảy ra lỗi khi đặt lịch');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Không tìm thấy bác sĩ</p>
      </div>
    );
  }

  // ── Step indicator ──────────────────────────────────────────────────────
  const steps = [
    { num: 1, label: 'Chọn lịch khám' },
    { num: 2, label: 'Thông tin bệnh nhân' },
    { num: 3, label: 'Xác nhận' },
  ];

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, idx) => {
        const isActive = currentStep === step.num;
        const isCompleted = currentStep > step.num;
        return (
          <div key={step.num} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? <FaCheckCircle className="text-lg" /> : step.num}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 ${
                  currentStep > step.num ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // ── STEP 1 ──────────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div>
      {/* Date picker – horizontal scroll */}
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <FaCalendarAlt className="text-blue-600" />
        Chọn ngày khám
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-3 mb-6 scrollbar-thin">
        {next7Days.map((day) => {
          const isSelected = selectedDate === day.dateStr;
          return (
            <button
              key={day.dateStr}
              onClick={() => {
                setSelectedDate(day.dateStr);
                setSelectedSlot(null);
              }}
              className={`flex-shrink-0 w-20 py-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <div
                className={`text-xs font-medium ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}
              >
                {day.dayName}
              </div>
              <div
                className={`text-xl font-bold mt-0.5 ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}
              >
                {day.dayNum}
              </div>
              <div
                className={`text-xs ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}
              >
                Tháng {day.month}
              </div>
            </button>
          );
        })}
      </div>

      {/* Time slots grid */}
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <FaClock className="text-blue-600" />
        Chọn giờ khám
      </h3>

      {filteredSlots.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <FaClock className="text-4xl mx-auto mb-2 opacity-40" />
          <p>Không có lịch khám trong ngày này</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {filteredSlots.map((slot) => {
            const isSelected = selectedSlot?.id === slot.id;
            return (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(slot)}
                className={`py-3 px-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white border-blue-200 text-gray-700 hover:bg-blue-50'
                }`}
              >
                {formatTime(slot.start_time)}
              </button>
            );
          })}
        </div>
      )}

      {/* Continue button */}
      <div className="mt-8 flex justify-end">
        <button
          disabled={!selectedSlot}
          onClick={() => setCurrentStep(2)}
          className={`px-8 py-3 rounded-xl font-semibold text-white transition-all ${
            selectedSlot
              ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );

  // ── STEP 2 ──────────────────────────────────────────────────────────────
  const inputBase =
    'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all';

  const renderStep2 = () => (
    <div>
      <div className="grid gap-5">
        {/* Full name */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
            <FaUser className="text-blue-500" /> Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="full_name"
            value={patientForm.full_name}
            onChange={handleFormChange}
            placeholder="Nhập họ và tên"
            className={inputBase}
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
            <FaPhone className="text-blue-500" /> Số điện thoại <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone_number"
            value={patientForm.phone_number}
            onChange={handleFormChange}
            placeholder="Nhập số điện thoại"
            className={inputBase}
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
            <FaEnvelope className="text-blue-500" /> Email
          </label>
          <input
            type="email"
            name="email"
            value={patientForm.email}
            onChange={handleFormChange}
            placeholder="Nhập email (tuỳ chọn)"
            className={inputBase}
          />
        </div>

        {/* Gender + DOB row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <FaVenusMars className="text-blue-500" /> Giới tính
            </label>
            <select
              name="gender"
              value={patientForm.gender}
              onChange={handleFormChange}
              className={inputBase}
            >
              <option value="">-- Chọn --</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <FaBirthdayCake className="text-blue-500" /> Ngày sinh
            </label>
            <input
              type="date"
              name="date_of_birth"
              value={patientForm.date_of_birth}
              onChange={handleFormChange}
              className={inputBase}
            />
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
            <FaNotesMedical className="text-blue-500" /> Lý do khám <span className="text-red-500">*</span>
          </label>
          <textarea
            name="reason_for_visit"
            value={patientForm.reason_for_visit}
            onChange={handleFormChange}
            placeholder="Mô tả triệu chứng hoặc lý do khám"
            rows={4}
            className={inputBase + ' resize-none'}
            required
          />
        </div>

        {/* Payment method */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <FaCreditCard className="text-blue-500" /> Hình thức thanh toán
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Offline */}
            <button
              type="button"
              onClick={() => setPaymentMethod('offline')}
              className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                paymentMethod === 'offline'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="text-2xl mb-1">🏥</div>
              <div className="font-semibold text-gray-800 text-sm">Thanh toán tại phòng khám</div>
              <div className="text-xs text-gray-500 mt-0.5">Thanh toán trực tiếp khi đến khám</div>
            </button>
            {/* Online */}
            <button
              type="button"
              onClick={() => setPaymentMethod('online')}
              className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                paymentMethod === 'online'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="text-2xl mb-1">💳</div>
              <div className="font-semibold text-gray-800 text-sm">Chuyển khoản ngân hàng</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Thanh toán qua tài khoản ngân hàng
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setCurrentStep(1)}
          className="px-6 py-3 rounded-xl font-semibold border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
        >
          Quay lại
        </button>
        <button
          disabled={!isStep2Valid}
          onClick={() => setCurrentStep(3)}
          className={`px-8 py-3 rounded-xl font-semibold text-white transition-all ${
            isStep2Valid
              ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );

  // ── STEP 3 ──────────────────────────────────────────────────────────────
  const renderStep3 = () => (
    <div>
      <div className="bg-blue-50 rounded-xl p-6 space-y-5">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Xác nhận thông tin đặt lịch</h3>

        {/* Doctor info */}
        <div className="space-y-1">
          <p className="text-sm text-gray-500 font-medium">Bác sĩ</p>
          <p className="font-semibold text-gray-800">{doctor.full_name}</p>
          <p className="text-sm text-blue-600">{doctor.Specialty?.specialty_name || ''}</p>
        </div>

        <hr className="border-blue-200" />

        {/* Appointment info */}
        <div className="space-y-1">
          <p className="text-sm text-gray-500 font-medium">Lịch khám</p>
          <p className="font-semibold text-gray-800">{formatDate(selectedDate)}</p>
          {selectedSlot && (
            <p className="text-sm text-gray-600">
              {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
            </p>
          )}
        </div>

        <hr className="border-blue-200" />

        {/* Patient info */}
        <div className="space-y-1">
          <p className="text-sm text-gray-500 font-medium">Bệnh nhân</p>
          <p className="font-semibold text-gray-800">{patientForm.full_name}</p>
          <p className="text-sm text-gray-600">{patientForm.phone_number}</p>
          {patientForm.email && (
            <p className="text-sm text-gray-600">{patientForm.email}</p>
          )}
        </div>

        <hr className="border-blue-200" />

        {/* Reason */}
        <div className="space-y-1">
          <p className="text-sm text-gray-500 font-medium">Lý do khám</p>
          <p className="text-gray-800">{patientForm.reason_for_visit}</p>
        </div>

        <hr className="border-blue-200" />

        {/* Payment */}
        <div className="space-y-1">
          <p className="text-sm text-gray-500 font-medium">Hình thức thanh toán</p>
          <p className="font-semibold text-gray-800">
            {paymentMethod === 'offline'
              ? '🏥 Thanh toán tại phòng khám'
              : '💳 Chuyển khoản ngân hàng'}
          </p>
        </div>

        <hr className="border-blue-200" />

        {/* Price */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 font-medium">Chi phí khám</p>
          <p className="text-xl font-bold text-blue-700">
            {formatPrice(doctor.price_per_appointment)}
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setCurrentStep(2)}
          className="px-6 py-3 rounded-xl font-semibold border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
        >
          Quay lại
        </button>
        <button
          disabled={submitting}
          onClick={handleSubmit}
          className={`px-8 py-3 rounded-xl font-semibold text-white transition-all flex items-center gap-2 ${
            submitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
          }`}
        >
          {submitting && (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {submitting ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
        </button>
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── LEFT COLUMN: Doctor Info ────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <img
                src={doctor.image_url || doctor.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.full_name)}&size=400&background=3b82f6&color=fff`}
                alt={doctor.full_name}
                className="w-full aspect-square rounded-xl object-cover mb-5"
              />

              <h2 className="text-2xl font-bold text-gray-800 mb-2">{doctor.full_name}</h2>

              <span className="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-medium mb-4">
                {doctor.Specialty?.specialty_name || doctor.specialty || ''}
              </span>

              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <FaBriefcase className="text-blue-500 flex-shrink-0" />
                  <span className="text-sm">{doctor.experience_years} năm kinh nghiệm</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <FaMoneyBillWave className="text-blue-500 flex-shrink-0" />
                  <span className="text-sm">
                    {formatPrice(doctor.price_per_appointment)} / lần khám
                  </span>
                </div>
                <div className="flex items-start gap-3 text-gray-600">
                  <FaMapMarkerAlt className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{doctor.address}</span>
                </div>
              </div>

              {doctor.bio && (
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-2">Giới thiệu</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{doctor.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Booking Flow ──────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <StepIndicator />

              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
