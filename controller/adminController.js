const User = require("../models/usermodel");
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

    console.log("dkmklm");

    const admin = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
      role: "admin",
    });

    console.log(admin);
    if (!admin || admin.role !== "admin") {
      return res.render("admin/login", { message: "Invalid credential"||"" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.render("admin/login", { message: "Invalid credential"||"" });
      console.log(massage);
    }

    req.session.admin = true;
    req.session.userId = admin;

    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error);
    res.render("admin/login", { message: "Login failed"||"" });
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

const loadUserManage = async (req, res) => {
  try {
    const users = await User.find({})
    console.log(users);

    return res.render("admin/usermanage",{ users });
    
  } catch (error) {
    console.log("usermanage page not found");
    res.status(500).send("server error");
  }
};

const loadUserUpdate = async (req, res) => {
  try {
    return res.render("admin/userupdate");
  } catch (error) {
    console.log("userupdate page not found");
    res.status(500).send("server error");
  }
};

const loadProductManage = async (req, res) => {
  try {
    return res.render("admin/productmanage");
  } catch (error) {
    console.log("productmanage page not found");
    res.status(500).send("server error");
  }
};

module.exports = {
  loadLogin,
  loadDashboard,
  login,
  loadUserManage,
  loadUserUpdate,
  loadProductManage,
};
