const User = require("../../models/usermodel");
const bcrypt = require("bcrypt");

const loadLogin = async (req, res) => {
  try {
    return res.render("admin/login");
  } catch (error) {
    console.log("adminlogin page not found");
    res.status(500).send("server error");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
      role: "admin",
    });

    if (!admin || admin.role !== "admin") {
      return res.render("admin/login", { message: "Invalid credential" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.render("admin/login", { message: "Invalid password" });
    }

    req.session.admin = true;
    req.session.userId = admin;
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error);
    res.render("admin/login", { message: "Login failed" });
  }
};

const loadDashboard = async (req, res) => {
  try {
    return res.render("admin/dashboard");
  } catch (error) {
    console.log("admindashboard page not found");
    res.status(500).send("server error");
  }
};

const adminLogout = async (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
};

module.exports = { loadLogin, login, loadDashboard, adminLogout };