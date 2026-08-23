const nodemailer= require("nodemailer"); 
    const sendMail = async (to, subject, html) => {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    
    const mailOptions = {
        from: `"Hệ thống đặt lịch khám bệnh" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    };

        await transporter.sendMail(mailOptions);
    };
    module.exports = sendMail;
