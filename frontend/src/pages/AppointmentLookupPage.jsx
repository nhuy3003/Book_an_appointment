import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaSearch,
  FaCalendarAlt,
  FaUserMd,
  FaClock,
  FaMoneyBillWave,
  FaInfoCircle,
  FaClipboardList,
  FaHashtag,
  FaUser,
  FaSignInAlt,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import StatusBadge from '../components/common/StatusBadge';
import { USE_MOCK, mockAppointmentLookup, mockMyAppointments } from '../data/mockData';
import { appointmentApi } from '../api/apiServices';
import { isLoggedIn, getPatientInfo } from '../utils/authUtils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
}

function formatVND(amount) {
  if (amount == null) return '';
  return Number(amount).toLocaleString('vi-VN') + ' đ';
}

function getPaymentMethodText(method) {
  if (!method) return '';
  if (method === 'offline') return 'Tại phòng khám';
  if (method === 'online') return 'Chuyển khoản';
  return method;
}

function getPaymentStatusText(status) {
  if (!status) return '';
  if (status === 'pending') return 'Chưa thanh toán';
  if (status === 'paid') return 'Đã thanh toán';
  if (status === 'failed') return 'Thất bại';
  if (status === 'refunded') return 'Đã hoàn tiền';
  return status;
}

function getStatusFilterLabel(status) {
  const map = {
    all: 'Tất cả',
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    missed: 'Vắng mặt',
  };
  return map[status] || status;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AppointmentLookupPage() {
  const loggedIn = isLoggedIn();
  const patientInfo = getPatientInfo();

  // Tab: 'my-appointments' (khi đã đăng nhập) hoặc 'lookup' (tra cứu bằng mã)
  const [activeTab, setActiveTab] = useState(loggedIn ? 'my-appointments' : 'lookup');

  // ─── State cho tab "Lịch hẹn của tôi" ──────────────────────────────────
  const [myAppointments, setMyAppointments] = useState([]);
  const [loadingMy, setLoadingMy] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // ─── State cho tab "Tra cứu theo mã" ───────────────────────────────────
  const [code, setCode] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [searched, setSearched] = useState(false);

  // ─── Fetch lịch hẹn cá nhân ─────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'my-appointments') return;
    if (!loggedIn && !USE_MOCK) return;

    async function fetchMyAppointments() {
      setLoadingMy(true);
      try {
        if (USE_MOCK) {
          await new Promise((r) => setTimeout(r, 600));
          setMyAppointments(mockMyAppointments);
        } else {
          const res = await appointmentApi.getMyAppointments();
          setMyAppointments(res.data || res || []);
        }
      } catch (err) {
        console.error('Fetch my appointments error:', err);
        toast.error('Không thể tải danh sách lịch hẹn');
      } finally {
        setLoadingMy(false);
      }
    }

    fetchMyAppointments();
  }, [activeTab, loggedIn]);

  // ─── Lọc lịch hẹn theo trạng thái ──────────────────────────────────────
  const filteredAppointments =
    statusFilter === 'all'
      ? myAppointments
      : myAppointments.filter((a) => a.status === statusFilter);

  // ─── Tra cứu theo mã ───────────────────────────────────────────────────
  const handleLookup = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error('Vui lòng nhập mã cuộc hẹn');
      return;
    }

    setLoadingLookup(true);
    setLookupResult(null);
    setSearched(false);

    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 800));
        if (trimmed.toUpperCase() === 'APT001') {
          setLookupResult(mockAppointmentLookup);
        } else {
          // Tìm trong mock list
          const found = mockMyAppointments.find(
            (a) => a.appointment_code.toUpperCase() === trimmed.toUpperCase()
          );
          setLookupResult(found || null);
        }
      } else {
        const res = await appointmentApi.lookup(trimmed);
        setLookupResult(res.data || res);
      }
    } catch (err) {
      console.error('Lookup error:', err);
      toast.error('Đã xảy ra lỗi khi tra cứu. Vui lòng thử lại.');
    } finally {
      setLoadingLookup(false);
      setSearched(true);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ── Page Header ────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tra cứu lịch hẹn</h1>
          <p className="text-gray-500">
            {loggedIn || USE_MOCK
              ? 'Xem tất cả lịch hẹn của bạn hoặc tra cứu theo mã cuộc hẹn'
              : 'Đăng nhập để xem tất cả lịch hẹn hoặc tra cứu bằng mã cuộc hẹn'}
          </p>
        </div>

        {/* ── Tab Navigation ─────────────────────────────────────────── */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => {
              setActiveTab('my-appointments');
              setSelectedAppointment(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'my-appointments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaClipboardList />
            Lịch hẹn của tôi
          </button>
          <button
            onClick={() => {
              setActiveTab('lookup');
              setSelectedAppointment(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'lookup'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaHashtag />
            Tra cứu theo mã
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* TAB 1: LỊCH HẸN CỦA TÔI                                  */}
        {/* ════════════════════════════════════════════════════════════ */}
        {activeTab === 'my-appointments' && (
          <>
            {/* Nếu chưa đăng nhập VÀ không dùng mock → gợi ý đăng nhập */}
            {!loggedIn && !USE_MOCK ? (
              <div className="max-w-md mx-auto text-center">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <FaSignInAlt className="text-3xl text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Đăng nhập để xem lịch hẹn
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Đăng nhập tài khoản để xem tất cả lịch hẹn của bạn, theo dõi trạng thái
                    và quản lý thông tin khám bệnh.
                  </p>
                  {/* TODO: Cập nhật link khi có trang login */}
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <FaSignInAlt />
                    Đăng nhập ngay
                  </Link>
                  <p className="mt-4 text-xs text-gray-400">
                    Hoặc chuyển sang tab <strong>"Tra cứu theo mã"</strong> nếu bạn có mã cuộc hẹn
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* ── Thông tin người dùng + Filter ──────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  {/* User greeting */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <FaUser className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Xin chào,</p>
                      <p className="font-semibold text-gray-800">
                        {patientInfo?.full_name || 'Nguyễn Thị Mai'}
                      </p>
                    </div>
                  </div>

                  {/* Status filter */}
                  <div className="flex flex-wrap gap-2">
                    {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                          statusFilter === status
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {getStatusFilterLabel(status)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Loading ───────────────────────────────────────── */}
                {loadingMy && (
                  <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-gray-400 text-sm">Đang tải lịch hẹn...</p>
                    </div>
                  </div>
                )}

                {/* ── Empty state ──────────────────────────────────── */}
                {!loadingMy && filteredAppointments.length === 0 && (
                  <div className="text-center py-16">
                    <FaCalendarAlt className="text-5xl text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-500 mb-1">
                      {statusFilter === 'all'
                        ? 'Bạn chưa có lịch hẹn nào'
                        : `Không có lịch hẹn "${getStatusFilterLabel(statusFilter)}"`}
                    </h3>
                    <p className="text-gray-400 text-sm mb-6">
                      Hãy đặt lịch khám để bắt đầu chăm sóc sức khỏe
                    </p>
                    <Link
                      to="/doctors"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <FaUserMd />
                      Tìm bác sĩ & Đặt lịch
                    </Link>
                  </div>
                )}

                {/* ── Appointment List ─────────────────────────────── */}
                {!loadingMy && filteredAppointments.length > 0 && !selectedAppointment && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 mb-2">
                      Hiển thị {filteredAppointments.length} lịch hẹn
                    </p>
                    {filteredAppointments.map((apt) => (
                      <AppointmentListItem
                        key={apt.id}
                        appointment={apt}
                        onSelect={() => setSelectedAppointment(apt)}
                      />
                    ))}
                  </div>
                )}

                {/* ── Appointment Detail (khi click vào 1 item) ───── */}
                {selectedAppointment && (
                  <div>
                    <button
                      onClick={() => setSelectedAppointment(null)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm mb-4 cursor-pointer"
                    >
                      ← Quay lại danh sách
                    </button>
                    <AppointmentDetailCard appointment={selectedAppointment} />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* TAB 2: TRA CỨU THEO MÃ                                    */}
        {/* ════════════════════════════════════════════════════════════ */}
        {activeTab === 'lookup' && (
          <>
            {/* Search form */}
            <div className="max-w-xl mx-auto text-center mb-10">
              <p className="text-gray-500 mb-6">
                Nhập mã cuộc hẹn (VD: APT001) để xem thông tin chi tiết
              </p>
              <form onSubmit={handleLookup} className="flex gap-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã cuộc hẹn (VD: APT001)"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 font-medium uppercase placeholder:normal-case placeholder:text-gray-400 transition-shadow duration-200"
                />
                <button
                  type="submit"
                  disabled={loadingLookup}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                >
                  {loadingLookup ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FaSearch />
                  )}
                  Tra cứu
                </button>
              </form>
            </div>

            {/* Lookup Result */}
            {searched && lookupResult && (
              <AppointmentDetailCard appointment={lookupResult} />
            )}

            {/* Not Found */}
            {searched && !lookupResult && (
              <div className="max-w-md mx-auto text-center">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <FaSearch className="text-5xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Không tìm thấy lịch hẹn với mã này
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Vui lòng kiểm tra lại mã cuộc hẹn và thử lại. Mã cuộc hẹn được cung cấp
                    khi bạn đặt lịch thành công.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

/**
 * Card tóm tắt 1 lịch hẹn trong danh sách
 */
function AppointmentListItem({ appointment, onSelect }) {
  const apt = appointment;
  const slot = apt?.BookableSlot;
  const doctor = slot?.Doctor;
  const specialty = doctor?.Specialty;

  return (
    <button
      onClick={onSelect}
      className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:shadow-md hover:border-blue-200 transition-all text-left cursor-pointer group"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Left — Doctor avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <FaUserMd className="text-blue-600 text-lg" />
          </div>
        </div>

        {/* Middle — Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-bold text-blue-600">
              {apt.appointment_code}
            </span>
            <StatusBadge status={apt.status} />
          </div>
          <p className="font-semibold text-gray-800 truncate">
            {doctor?.full_name || 'Bác sĩ'}
          </p>
          <p className="text-sm text-gray-500">
            {specialty?.specialty_name || ''}
            {slot?.slot_date && ` • ${formatDate(slot.slot_date)}`}
            {slot?.start_time && ` • ${formatTime(slot.start_time)}`}
          </p>
        </div>

        {/* Right — Price + Arrow */}
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          <span className="font-semibold text-gray-800 text-sm">
            {formatVND(apt.price)}
          </span>
          <span className="text-gray-300 group-hover:text-blue-500 transition-colors text-lg">
            →
          </span>
        </div>
      </div>
    </button>
  );
}

/**
 * Card chi tiết đầy đủ 1 lịch hẹn
 */
function AppointmentDetailCard({ appointment }) {
  const apt = appointment;
  const slot = apt?.BookableSlot;
  const doctor = slot?.Doctor;
  const specialty = doctor?.Specialty;
  const patient = apt?.Patient;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="font-mono text-2xl font-bold text-blue-600 tracking-wider">
            {apt.appointment_code}
          </h2>
          <StatusBadge status={apt.status} />
        </div>

        <hr className="border-gray-200 mb-6" />

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {doctor?.full_name && (
            <InfoItem
              icon={<FaUserMd className="text-blue-500" />}
              label="Bác sĩ"
              value={doctor.full_name}
            />
          )}

          {specialty?.specialty_name && (
            <InfoItem
              icon={<FaInfoCircle className="text-purple-500" />}
              label="Chuyên khoa"
              value={specialty.specialty_name}
            />
          )}

          {slot?.slot_date && (
            <InfoItem
              icon={<FaCalendarAlt className="text-green-500" />}
              label="Ngày khám"
              value={formatDate(slot.slot_date)}
            />
          )}

          {(slot?.start_time || slot?.end_time) && (
            <InfoItem
              icon={<FaClock className="text-orange-500" />}
              label="Giờ khám"
              value={`${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`}
            />
          )}

          {patient?.full_name && (
            <InfoItem
              icon={<FaUser className="text-teal-500" />}
              label="Bệnh nhân"
              value={patient.full_name}
            />
          )}

          {patient?.phone_number && (
            <InfoItem
              icon={<FaInfoCircle className="text-teal-500" />}
              label="Số điện thoại"
              value={patient.phone_number}
            />
          )}

          {apt.reason_for_visit && (
            <div className="sm:col-span-2">
              <InfoItem
                icon={<FaInfoCircle className="text-gray-400" />}
                label="Lý do khám"
                value={apt.reason_for_visit}
              />
            </div>
          )}

          {apt.price != null && (
            <InfoItem
              icon={<FaMoneyBillWave className="text-green-600" />}
              label="Giá khám"
              value={formatVND(apt.price)}
            />
          )}

          {apt.payment_method && (
            <InfoItem
              icon={<FaMoneyBillWave className="text-indigo-500" />}
              label="Thanh toán"
              value={getPaymentMethodText(apt.payment_method)}
            />
          )}

          {apt.payment_status && (
            <div className="sm:col-span-2">
              <InfoItem
                icon={<FaMoneyBillWave className="text-amber-500" />}
                label="Trạng thái thanh toán"
                value={getPaymentStatusText(apt.payment_status)}
                valueClass={
                  apt.payment_status === 'paid'
                    ? 'text-green-600 font-semibold'
                    : 'text-amber-600 font-semibold'
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable info item
 */
function InfoItem({ icon, label, value, valueClass = '' }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-gray-800 ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}
