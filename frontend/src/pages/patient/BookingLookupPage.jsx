import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';

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
    try {
      // Endpoint tra cứu lịch hẹn theo appointment_code
      const res = await axiosClient.get(`/appointments/code/${code.trim()}`);
      setResult(res);
    } catch (err) {
      setError(err?.message || 'Không tìm thấy thông tin lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <h1 className="text-xl font-bold text-slate-800 mb-2">Tra Cứu Lịch Hẹn Khám</h1>
        <p className="text-xs text-slate-500 mb-4">
          Nhập mã cuộc hẹn (ví dụ: <code className="bg-slate-100 px-1 py-0.5 rounded">APT-20261025-001</code>) để tra cứu trạng thái.
        </p>

        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Nhập mã lịch hẹn..."
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            {loading ? 'Đang tìm...' : 'Tra cứu'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <h3 className="font-bold text-slate-800 mb-2">Thông tin lịch hẹn:</h3>
            <pre className="overflow-x-auto text-slate-700">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

