const User = require("../models/usermodel");
const bcrypt = require("bcrypt");
const Product= require("../models/productmodel")




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
      return res.render("admin/login", { message: "Invalid password"||"" });
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
//------------ User Update Page ----------------
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
//----------- Updating User -------------------
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
//----------- Ban user ------------------------
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
// ---------Product Manage --------------------
// --------------------------------------------

const loadProductManage = async (req, res) => {
  try {

  const products = await  Product.find({})

  

    return res.render("admin/productmanage", { products });
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

const Productcreate= async (req,res)=>{

  console.log(req.body)

  const { productname, category, brand, price, offer, stock, warranty, color, description, rating } = req.body;

  const image = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

  if (image.length < 3) {
    return res.status(400).send('Minimum 3 images required');
  }


  const newProduct = new Product({
    productname,
    category,
    brand,
    price,
    offer,
    stock,
    warranty,
    color,
    description,
    rating,
    image
  });
  await newProduct.save();

 res.redirect("/admin/productmanage")
}

const loadProductcreate =async (req, res)=>{

  try {

    res.render('admin/productcreate')
    
  } catch (error) {
    console.log("productcreate page not found");
    res.status(500).send("server error");
  }
}

const loadProductview = async (req ,res)=>{


  try {
    
    res.render('admin/productview')

  } catch (error) {
    console.log("productview page not found");
    res.status(500).send("server error");
  }
}








const loadCategoryManage = async (req, res)=>{


  try {

    res.render('admin/categorymanage')
    
  } catch (error) {
    console.log("categorymanage page not found");
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
  loadProductcreate,
  loadProductview,
  loadCategoryManage,
  Productcreate,
};
