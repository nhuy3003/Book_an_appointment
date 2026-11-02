import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [doctor, setDoctor] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

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

  // Thiết lập kết nối Socket.io khi bác sĩ đã đăng nhập
  useEffect(() => {
    if (doctor?.id) {
      const socketServerUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
      const socketInstance = io(socketServerUrl, {
        transports: ['websocket', 'polling'],
      });

      socketInstance.on('connect', () => {
        socketInstance.emit('join_doctor', doctor.id);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
        setSocket(null);
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [doctor?.id]);

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
        socket,
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

