const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const doctorRepository = require("../repositories/doctor.repository");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const { addToken } = require("../utils/tokenBlacklist");
const { getToken, setToken, clearToken } = require("../utils/tokenStore");

// Login
const loginDoctor = async (email, password) => {
  const doctor = await doctorRepository.findByEmail(email);
  if (!doctor) throw new ApiError(404, "Email không tồn tại");

  const isMatch = await bcrypt.compare(password, doctor.password);
  if (!isMatch) throw new ApiError(401, "Sai mật khẩu");

  // Nếu có token cũ → blacklist luôn
  const oldToken = getToken(doctor.id);
  if (oldToken) addToken(oldToken);

  // Tạo token mới
  const token = jwt.sign(
    { id: String(doctor.id), role: "doctor" },
    env.jwtSecret,
    { expiresIn: "1d" }
  );

  // Lưu token mới
  setToken(doctor.id, token);

  return {
    token,
    doctor: {
      id: doctor.id,
      full_name: doctor.full_name,
      email: doctor.email,
    },
  };
};

// Change password
const changePassword = async (doctorId, oldPassword, newPassword, confirmPassword) => {
  const doctor = await doctorRepository.findDoctorById(doctorId);
  const isMatch = await bcrypt.compare(oldPassword, doctor.password);
    if (!isMatch) throw new Error("Mật khẩu cũ không đúng");
    if(newPassword.length < 6) throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự");
    if(newPassword === oldPassword) throw new Error("Mật khẩu mới không được trùng với mật khẩu cũ");
    if(newPassword !== confirmPassword) throw new Error("Mật khẩu xác nhận không trùng khớp với mật khẩu mới");
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await doctorRepository.updatePassword(doctorId, hashedPassword);
  
  return { message: "Đổi mật khẩu thành công!" };
};

// Logout
const logoutService = (token) => {
  if (!token) throw new Error("Token đã được dùng");

  // Blacklist token ngay lập tức
  addToken(token);

  // Xóa token khỏi store (nếu còn)
  // Lấy decoded id để xóa tokenStore
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    clearToken(String(decoded.id));
  } catch {
    // token không hợp lệ thì không cần clear
  }

  return { message: "Đăng xuất thành công" };
};

module.exports = {
  loginDoctor,
  changePassword,
  logoutService,
};