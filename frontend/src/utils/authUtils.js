const TOKEN_KEY = "patient_token";
const PATIENT_INFO_KEY = "patient_info";

/**
 * Kiểm tra người dùng đã đăng nhập chưa
 */
export function isLoggedIn() {
  const token = localStorage.getItem(TOKEN_KEY);
  return !!token;
}

/**
 * Lấy token hiện tại
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Lấy thông tin patient đã lưu
 * @returns {{ id: number, full_name: string, email: string, phone_number: string, address: string } | null}
 */
export function getPatientInfo() {
  try {
    const raw = localStorage.getItem(PATIENT_INFO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Lấy patient ID
 */
export function getPatientId() {
  const info = getPatientInfo();
  return info?.id || null;
}

/**
 * Lưu thông tin đăng nhập (gọi sau khi login thành công)
 */
export function saveAuth(token, patientInfo) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(PATIENT_INFO_KEY, JSON.stringify(patientInfo));
}

/**
 * Xoá thông tin đăng nhập (gọi khi logout)
 */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PATIENT_INFO_KEY);
}
