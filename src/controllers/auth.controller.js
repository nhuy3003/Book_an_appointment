const authService = require("../services/auth.service");
const response = require("../utils/response");
const { logoutService } = require("../services/auth.service");
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

        if(newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "Mật khẩu xác nhận không khớp với mật khẩu mới"
            });
        }
        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: "Vui lòng điền đầy đủ thông tin"
            });
        }
        if(newPassword.length < 6) {
            return res.status(400).json({
                message: "Mật khẩu mới phải có ít nhất 6 ký tự"
            });
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
            return res.status(400).json({
                message: "Token không tồn tại",
            });
        }
        const token = authHeader.split(" ")[1];

        const result = logoutService(token);

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            message: "Đăng xuất thất bại",
            error: error.message
        });
    }
};

module.exports = {
    loginDoctor,
    changePassword,
    logout
};
