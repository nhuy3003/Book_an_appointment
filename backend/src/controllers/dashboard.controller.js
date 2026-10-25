const dashboardService = require("../services/dashboard.service");
const response = require("../utils/response");

const getDashboardStats = async (req, res, next) => {

  try {

    const doctorId = req.user.id;

    const stats =
      await dashboardService.getDashboardStats(doctorId);

    return response.success(
      res,
      stats,
      "Lấy dashboard thành công"
    );

  } catch (error) {
    next(error);
  }

};

module.exports = {
  getDashboardStats
};