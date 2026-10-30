import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Component bảo vệ các route nội bộ của Bác sĩ (/doctor/schedule, /doctor/appointments,...)
 * Nếu chưa đăng nhập -> Tự động chuyển hướng về trang /doctor/login.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500 text-sm">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-2"></div>
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/doctor/login" replace />;
  }

  return <Outlet />;
}
