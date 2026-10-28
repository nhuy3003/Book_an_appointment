import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [doctor, setDoctor] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Đọc trạng thái đăng nhập từ localStorage khi reload web
    const savedToken = localStorage.getItem('token');
    const savedDoctor = localStorage.getItem('doctor');

    if (savedToken) {
      setToken(savedToken);
      if (savedDoctor) {
        try {
          setDoctor(JSON.parse(savedDoctor));
        } catch (e) {
          console.error('Lỗi phân tích doctor profile', e);
        }
      }
    }
    setLoading(false);
  }, []);

  // Hàm Đăng nhập Bác sĩ
  const login = async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    // Backend trả về dạng: { success: true, data: { token, doctor: {...} }, message }
    const authData = res.data || res;
    const receivedToken = authData.token;
    const receivedDoctor = authData.doctor;

    if (!receivedToken) {
      throw new Error('Không nhận được token xác thực từ máy chủ');
    }

    localStorage.setItem('token', receivedToken);
    if (receivedDoctor) {
      localStorage.setItem('doctor', JSON.stringify(receivedDoctor));
    }

    setToken(receivedToken);
    setDoctor(receivedDoctor || null);
    return authData;
  };

  // Hàm Đổi mật khẩu Bác sĩ
  const changePassword = async (oldPassword, newPassword, confirmPassword) => {
    const res = await axiosClient.post('/auth/change-password', {
      oldPassword,
      newPassword,
      confirmPassword,
    });
    return res;
  };

  // Hàm Đăng xuất
  const logout = async () => {
    try {
      if (token) {
        await axiosClient.post('/auth/logout');
      }
    } catch (e) {
      // Vẫn tiếp tục dọn dẹp localStorage kể cả khi backend lỗi
      console.warn('Logout API failed or token expired:', e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('doctor');
      setToken(null);
      setDoctor(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        doctor,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        changePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

