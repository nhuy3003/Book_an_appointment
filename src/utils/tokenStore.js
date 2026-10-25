// Map: doctorId (string) -> token
const tokenStore = new Map();

const setToken = (doctorId, token) => {
  tokenStore.set(String(doctorId), token); // lưu luôn dưới dạng string
};

const getToken = (doctorId) => tokenStore.get(String(doctorId));

const clearToken = (doctorId) => tokenStore.delete(String(doctorId));

const clearAllTokens = () => tokenStore.clear();

module.exports = {
  setToken,
  getToken,
  clearToken,
  clearAllTokens,
};