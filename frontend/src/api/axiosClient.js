import axios from 'axios';

// Đọc base URL từ biến môi trường Vite (.env)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor Request: Tự động đính kèm Bearer Token nếu có trong localStorage
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor Response: Bắt lỗi chung và xử lý 401 Unauthorized
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Hết hạn phiên đăng nhập hoặc token không hợp lệ
      localStorage.removeItem('token');
      localStorage.removeItem('doctor');
      if (window.location.pathname.startsWith('/doctor') && window.location.pathname !== '/doctor/login') {
        window.location.href = '/doctor/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default axiosClient;

