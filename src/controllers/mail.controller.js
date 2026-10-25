const sendMail = require("../utils/sendMail");

const testSendMail = async (req, res, next) => {
  try {

    const { email } = req.body;

    const html = `
      <h2>Test gửi mail</h2>
      <p>Đây là email test từ hệ thống đặt lịch khám.</p>
    `;

    await sendMail(
      email,
      "Test email từ hệ thống",
      html
    );

    return res.json({
      success: true,
      message: "Gửi mail thành công"
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  testSendMail
};