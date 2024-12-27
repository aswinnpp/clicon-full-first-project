const adminSchema = require("../models/usermodel");
const bcrypt = require("bcrypt");

const loadLogin = async (req, res) => {
  res.render("admin/login");
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("dkmklm");

    const admin = await adminSchema.findOne({
      name: { $regex: new RegExp(`^${email}$`, "i") },
      role: "admin",
    });

    console.log(admin);
    if (!admin || admin.role !== "admin") {
      return res.render("admin/login", { message: 'Invalid credential' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.render("admin/login", { message: "Invalid credential" });
      console.log(massage)
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
  res.render("admin/dashboard");
};

const loadUserManage= async(req,res)=>{

res.render('admin/usermanage')

}

const loadUserUpdate= async (req,res)=>{
  res.render('admin/userupdate')
}

const loadProductManage= async (req,res)=>{
  res.render('admin/productmanage')
 
}



module.exports = { 
  loadLogin, 
  loadDashboard, 
  login,
  loadUserManage,
  loadUserUpdate,
  loadProductManage,
  
};
