import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Component bảo vệ các tuyến đường nội bộ của Bác sĩ.
 * Nếu chưa có token trong localStorage -> Tự động chuyển hướng về /doctor/login.
 */
export default function ProtectedRoute() {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/doctor/login" replace />;
  }

  return <Outlet />;
}

