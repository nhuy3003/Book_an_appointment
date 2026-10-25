const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { hasToken } = require("../utils/tokenBlacklist");
const { getToken } = require("../utils/tokenStore");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token required" });

  // Nếu token nằm trong blacklist -> vô hiệu hóa
  if (hasToken(token)) {
    return res.status(401).json({
      message: "Token đã bị vô hiệu hóa. Vui lòng đăng nhập lại",
    });
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, env.jwtSecret);

    // Kiểm tra token hiện tại trong store
    const currentToken = getToken(String(decoded.id));
    if (!currentToken || currentToken !== token) {
      return res.status(401).json({
        message: "Token không hợp lệ hoặc đã bị đăng nhập ở thiết bị khác",
      });
    }

    // Gán user vào request
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};

module.exports = authMiddleware;