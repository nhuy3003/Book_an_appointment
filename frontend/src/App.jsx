import React from 'react';
import { Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// === Patient Pages (Dev 2) ===
import HomePage from './pages/patient/HomePage';
import DoctorListPage from './pages/patient/DoctorListPage';
import BookingLookupPage from './pages/patient/BookingLookupPage';

// === Doctor Pages (Dev 1) ===
import DoctorLoginPage from './pages/doctor/DoctorLoginPage';
import DoctorSchedulePage from './pages/doctor/DoctorSchedulePage';
import DoctorAppointmentsPage from './pages/doctor/DoctorAppointmentsPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<MainLayout />}>
          {/* ===== PATIENT PORTAL (Public) - Dev 2 phụ trách ===== */}
          <Route path="/" element={<HomePage />} />
          <Route path="/doctors" element={<DoctorListPage />} />
          <Route path="/booking-lookup" element={<BookingLookupPage />} />

          {/* ===== DOCTOR PORTAL - Dev 1 phụ trách ===== */}
          <Route path="/doctor/login" element={<DoctorLoginPage />} />

          {/* Các route bảo vệ (cần đăng nhập) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/doctor/schedule" element={<DoctorSchedulePage />} />
            <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
