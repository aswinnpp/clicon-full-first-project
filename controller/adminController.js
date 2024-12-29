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
// --------------------------------------------
// ----------- User Management-----------------
// --------------------------------------------
const loadUserManage = async (req, res) => {
  try {
    
    const users = await User.find({})
    console.log("consolling users:",users);
    

    return res.render("admin/usermanage",{ users });
    
  } catch (error) {
    console.log("usermanage page not found");
    res.status(500).send("server error");
  }
};

const loadUserUpdate = async (req, res) => {
  try {

    const { id } = req.params;

   
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).send('User not found');
    }
      
        res.render('admin/userupdate', { user });
    
  } catch (error) {
    console.log("userupdate page not found");
    res.status(500).send("server error");
  }
};

 const updateUser = async (req, res) => {
  try {
    const { id, name, email, password, phone } = req.body;

  
    const user = await User.findById(id);

    console.log(user)

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    
    const existingUser = await User.findOne({ email, _id: { $ne: id } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use by another user' });
    }

   
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;

    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    
    await user.save();

   
    res.redirect('/admin/usermanage')
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: "An error occurred while updating the user." });
  }
};


const banUser=  async (req, res) => {
  const { userId } = req.body;

  try {
    
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }


    user.isBan = !user.isBan; 
   

  
    await user.save();

   
    res.redirect('/admin/usermanage'); 

  } catch (error) {
    console.log(error);
    res.status(500).send('Error banning user');
  }
}
// --------------------------------------------
// --------------------------------------------
// --------------------------------------------



// --------------------------------------------
// ---------Product Update --------------------
// --------------------------------------------

const loadProductManage = async (req, res) => {
  try {
    return res.render("admin/productmanage");
  } catch (error) {
    console.log("productmanage page not found");
    res.status(500).send("server error");
  }
};

const loadProductUpdate= async (req, res)=>{

try {

  res.render('admin/productupdate')
  
} catch (error) {
  console.log("productupdate page not found");
    res.status(500).send("server error");
}


}






module.exports = {
  loadLogin,
  loadDashboard,
  login,
  loadUserManage,
  loadUserUpdate,
  loadProductManage,
  updateUser,
  banUser,
  loadProductUpdate,
};
