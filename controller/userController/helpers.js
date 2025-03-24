const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const sendOtpEmail = (email, otp) => {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Your OTP Verification Code",
    html: `<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
        <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">OTP Verification</h2>
        <p style="font-size: 16px; color: #666;">Your verification code is:</p>
        <div style="font-size: 24px; font-weight: bold; color: #4CAF50; margin: 20px 0;">${otp}</div>
        <p style="font-size: 14px; color: #999;">This code will expire in 10 minutes.</p>
        <p style="font-size: 14px; color: #999;">Status Code: 200 - Email sent successfully</p>
      </div>
    </div>`,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      console.error("Error sending OTP:", error);
      return 500; // Internal Server Error
    }
    return 200; // Success
  });
};

module.exports = { generateOTP, transporter, sendOtpEmail };
