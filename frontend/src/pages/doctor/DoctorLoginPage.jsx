import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

export default function DoctorLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await axiosClient.post('/auth/login', { email, password });
      const token = data.token || data.data?.token;
      if (token) {
        localStorage.setItem('token', token);
        if (data.data?.doctor) {
          localStorage.setItem('doctor', JSON.stringify(data.data.doctor));
        }
        navigate('/doctor/schedule');
      } else {
        setError('Không nhận được mã xác thực token');
      }
    } catch (err) {
      setError(err?.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Đăng Nhập Bác Sĩ</h1>
        <p className="text-xs text-slate-500 mt-1">Cổng thông tin và quản trị lịch khám bệnh</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email bác sĩ</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="doctor@example.com"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow-sm"
        >
          {loading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
        </button>
      </form>
    </div>
  );
}

