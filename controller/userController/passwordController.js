const userSchema = require("../../models/usermodel");
const bcrypt = require("bcrypt");
const { generateOTP, sendOtpEmail } = require("./helpers");


const loadForgot = (req, res) => {
  res.status(200).render("user/forgotpassword", { message: req.flash("message") });
};


const forgot = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userSchema.findOne({ email });

    if (!user) {
      req.flash("message", "User not found.");
      return res.status(404).redirect("/forgot");
    }

    const otp = generateOTP();
    req.session.otp = otp;
    req.session.type = "forgot";
    req.session.timestamp = Date.now();
    req.session.forgot = email;

    sendOtpEmail(email, otp);
    res.status(302).redirect("/otp");
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).send("Server Error");
  }
};


const loadReset = (req, res) => {
  res.status(200).render("user/resetpassword");
};

const reset = async (req, res) => {
  try {
    const { newpassword, newconfirmpassword } = req.body;
    if (newpassword !== newconfirmpassword) {
      req.flash("error", "Passwords do not match.");
      return res.status(400).redirect("/reset");
    }

    const user = await userSchema.findOne({ email: req.session.forgot });
    user.password = await bcrypt.hash(newpassword, 10);
    await user.save();

    req.flash("error", "Password reset successfully.");
    res.status(302).redirect("/signin");
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  loadForgot,
  forgot,
  loadReset,
  reset,
};
