import React, { useState, useEffect } from 'react';
import appointmentApi from '../../api/appointmentApi';
import { formatCurrency, formatDate, getAppointmentStatusBadge } from '../../utils/formatters';
import AppointmentDetailModal from '../../components/doctor/AppointmentDetailModal';

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Bộ lọc
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Modal chi tiết & cập nhật
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentApi.getDoctorAppointments({
        status: statusFilter,
        date: dateFilter || undefined,
      });
      const data = res.data || res || [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Không thể tải danh sách ca hẹn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateFilter]);

  // Cập nhật trạng thái và ghi chú
  const handleUpdateStatus = async (id, updateData) => {
    await appointmentApi.updateAppointment(id, updateData);
    fetchAppointments();
  };

  const openAppointmentDetail = async (item) => {
    setSelectedAppointment(item);
    setIsModalOpen(true);
    try {
      const res = await appointmentApi.getDetail(item.id);
      const detail = res?.data || res;
      if (detail) setSelectedAppointment(detail);
    } catch {
      // Giữ dữ liệu danh sách nếu không tải được chi tiết
    }
  };

  // Nút duyệt nhanh ca hẹn
  const handleQuickConfirm = async (id, e) => {
    e.stopPropagation();
    try {
      await appointmentApi.updateAppointment(id, { status: 'confirmed' });
      fetchAppointments();
    } catch (err) {
      alert(err?.message || 'Lỗi khi xác nhận lịch hẹn');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Thống kê nhanh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Danh Sách Lịch Hẹn Khám Bệnh (Appointments)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi, xác nhận và cập nhật tình trạng khám bệnh cho bệnh nhân
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg font-semibold">
            Tổng cộng: {appointments.length} ca hẹn
          </span>
        </div>
      </div>

      {/* Thanh Công Cụ: Bộ Lọc & Tìm Kiếm */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Lọc trạng thái */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-primary-500 bg-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt (Pending)</option>
              <option value="confirmed">Đã xác nhận (Confirmed)</option>
              <option value="completed">Đã khám (Completed)</option>
              <option value="cancelled">Đã hủy (Cancelled)</option>
              <option value="missed">Bỏ hẹn (Missed)</option>
            </select>
          </div>

          {/* Lọc theo ngày hẹn khám */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Ngày khám:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-primary-500"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Xóa ngày
              </button>
            )}
          </div>
        </div>

        <button
          onClick={fetchAppointments}
          className="text-xs text-primary-600 hover:text-primary-700 font-semibold px-3 py-1.5 rounded-lg border border-primary-200 hover:bg-primary-50 transition"
        >
          Làm mới
        </button>
      </div>

      {/* Bảng Danh Sách Lịch Hẹn */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            Đang tải dữ liệu ca hẹn...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <p className="text-sm">Không tìm thấy ca hẹn nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Mã Hẹn</th>
                  <th className="px-6 py-3.5">Bệnh Nhân</th>
                  <th className="px-6 py-3.5">Khung Giờ Khám</th>
                  <th className="px-6 py-3.5">Lý Do Khám</th>
                  <th className="px-6 py-3.5">Chi Phí</th>
                  <th className="px-6 py-3.5">Trạng Thái</th>
                  <th className="px-6 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((item) => {
                  const badge = getAppointmentStatusBadge(item.status);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => openAppointmentDetail(item)}
                      className="hover:bg-slate-50/80 cursor-pointer transition"
                    >
                      {/* Mã Hẹn */}
                      <td className="px-6 py-4 font-mono font-bold text-primary-600">
                        #{item.appointment_code}
                      </td>

                      {/* Bệnh Nhân */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">
                          {item.Patient?.full_name || 'Khách vãng lai'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {item.Patient?.phone_number || 'N/A'}
                        </p>
                      </td>

                      {/* Khung Giờ Khám */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">
                          {item.BookableSlot?.slot_date
                            ? formatDate(item.BookableSlot.slot_date)
                            : 'N/A'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {item.BookableSlot?.start_time?.slice(0, 5)} -{' '}
                          {item.BookableSlot?.end_time?.slice(0, 5)}
                        </p>
                      </td>

                      {/* Lý Do Khám */}
                      <td className="px-6 py-4 max-w-xs">
                        <p className="truncate text-slate-700" title={item.reason_for_visit}>
                          {item.reason_for_visit || 'Khám tổng quát'}
                        </p>
                        {item.note && (
                          <p className="text-[10px] text-primary-600 italic truncate">
                            BS: {item.note}
                          </p>
                        )}
                      </td>

                      {/* Chi Phí */}
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {formatCurrency(item.price)}
                      </td>

                      {/* Badge Trạng Thái */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Thao Tác */}
                      <td className="px-6 py-4 text-right space-x-2">
                        {item.status === 'pending' && (
                          <button
                            onClick={(e) => handleQuickConfirm(item.id, e)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[11px] font-semibold shadow-xs"
                          >
                            Duyệt nhanh
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openAppointmentDetail(item);
                          }}
                          className="text-primary-600 hover:text-primary-800 font-medium px-2 py-1 rounded hover:bg-primary-50"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Chi Tiết Lịch Hẹn */}
      <AppointmentDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
