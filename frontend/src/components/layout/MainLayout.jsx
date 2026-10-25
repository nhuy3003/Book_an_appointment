import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

export default function MainLayout() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('doctor');
    navigate('/doctor/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Header chính của Website */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 text-primary-600 font-bold text-xl tracking-tight">
                <span className="bg-primary-600 text-white rounded-lg p-1.5 flex items-center justify-center font-extrabold text-lg">
                  +
                </span>
                <span>MedCare</span>
              </Link>
            </div>

            {/* Menu chính cho Bệnh nhân */}
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
              <Link to="/" className="hover:text-primary-600 transition">
                Trang chủ
              </Link>
              <Link to="/doctors" className="hover:text-primary-600 transition">
                Danh sách Bác sĩ
              </Link>
              <Link to="/booking-lookup" className="hover:text-primary-600 transition">
                Tra cứu lịch hẹn
              </Link>
            </nav>

            {/* Khu vực Bác sĩ (Doctor Portal) */}
            <div className="flex items-center gap-3">
              {token ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/doctor/schedule"
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md font-medium"
                  >
                    Lịch làm việc
                  </Link>
                  <Link
                    to="/doctor/appointments"
                    className="text-xs bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-1.5 rounded-md font-medium"
                  >
                    Quản lý Ca hẹn
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <Link
                  to="/doctor/login"
                  className="text-xs border border-primary-600 text-primary-600 hover:bg-primary-50 px-3.5 py-1.5 rounded-md font-semibold transition"
                >
                  Cổng Bác sĩ
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Nội dung thay đổi theo Route */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer chuẩn thông thường */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© 2026 MedCare Clinic. Hệ thống Đặt Lịch Khám Bệnh Trực Tuyến.</p>
          <div className="flex space-x-6">
            <span className="hover:text-slate-800">Hotline: 1900 8888</span>
            <span className="hover:text-slate-800">Giờ làm việc: 7:30 - 18:00</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

