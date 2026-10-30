const authService = require("../services/auth.service");
const response = require("../utils/response");
const { logoutService } = require("../services/auth.service");
const ApiError = require("../utils/ApiError");
const loginDoctor = async (req, res, next) => {
    try {
        const { email, password} = req.body;

        const data = await authService.loginDoctor(email, password);

        return response.success(res, data, "Đăng nhập thành công");

    } catch (error) {
        next(error);
    }
};
const changePassword = async (req, res, next) => {
    try {

        const doctorId = req.user.id;
        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!oldPassword || !newPassword || !confirmPassword) {
            throw new ApiError(400, "Vui lòng điền đầy đủ thông tin");
        }
        if (newPassword !== confirmPassword) {
            throw new ApiError(400, "Mật khẩu xác nhận không khớp với mật khẩu mới");
        }
        if (newPassword.length < 6) {
            throw new ApiError(400, "Mật khẩu mới phải có ít nhất 6 ký tự");
        }
        await authService.changePassword(doctorId, oldPassword, newPassword, confirmPassword);
        return response.success(res, null, "Đổi mật khẩu thành công");
    } catch (error) {
        next(error);
    }

};

//Logout 
const logout = async (req, res, next) => {
    try{
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new ApiError(401, "Token không tồn tại");
        }
        const token = authHeader.split(" ")[1];

        const result = logoutService(token);

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    loginDoctor,
    changePassword,
    logout
};
