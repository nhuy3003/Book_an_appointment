import React, { useState } from 'react';
import appointmentApi from '../../api/appointmentApi';
import { formatCurrency, formatDate, getAppointmentStatusBadge } from '../../utils/formatters';

export default function BookingLookupPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await appointmentApi.getByCode(code.trim().toUpperCase());
      setResult(res?.data || res);
    } catch (err) {
      setError(err?.message || 'Không tìm thấy thông tin lịch hẹn với mã này');
    } finally {
      setLoading(false);
    }
  };

  const badge = result ? getAppointmentStatusBadge(result.status) : null;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Tra Cứu Lịch Hẹn Khám</h1>
          <p className="text-xs text-slate-500 mt-1">
            Nhập mã lịch hẹn để xem thông tin và trạng thái
          </p>
        </div>

        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ví dụ: APT001"
            className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 uppercase"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-70 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            {loading ? 'Đang tìm...' : 'Tra cứu'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Kết quả */}
      {result && badge && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header kết quả */}
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Mã lịch hẹn</p>
              <p className="font-mono font-bold text-lg text-primary-700">#{result.appointment_code}</p>
            </div>
            <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
              {badge.label}
            </span>
          </div>

          {/* Thông tin chi tiết */}
          <div className="p-6 space-y-4">
            {/* Bệnh nhân */}
            {result.Patient && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Bệnh nhân</p>
                  <p className="text-sm font-semibold text-slate-800">{result.Patient.full_name}</p>
                  {result.Patient.phone_number && (
                    <p className="text-xs text-slate-500">{result.Patient.phone_number}</p>
                  )}
                </div>
              </div>
            )}

            {/* Thời gian khám */}
            {result.BookableSlot && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Ngày & Giờ Khám</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatDate(result.BookableSlot.slot_date)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {result.BookableSlot.start_time?.slice(0, 5)} - {result.BookableSlot.end_time?.slice(0, 5)}
                  </p>
                </div>
              </div>
            )}

            {/* Lý do khám */}
            {result.reason_for_visit && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Lý Do Khám</p>
                  <p className="text-sm text-slate-700">{result.reason_for_visit}</p>
                </div>
              </div>
            )}

            {/* Chi phí */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Chi Phí Khám</p>
                <p className="text-sm font-bold text-primary-600">{formatCurrency(result.price)}</p>
                <p className="text-xs text-slate-400 capitalize">
                  {result.payment_method === 'offline' ? 'Tiền mặt' : 'Trực tuyến'} &bull; {
                    result.payment_status === 'paid' ? '✅ Đã thanh toán' :
                    result.payment_status === 'pending' ? '⏳ Chờ thanh toán' : result.payment_status
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
