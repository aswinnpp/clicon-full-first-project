const User = require("../models/usermodel");
const bcrypt = require("bcrypt");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel")
const path = require('path')
const fs = require ('fs')



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
      return res.render("admin/login", { message: "Invalid credential" || "" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.render("admin/login", { message: "Invalid password" || "" });
      console.log(massage);
    }

    req.session.admin = true;
    req.session.userId = admin;

    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error);
    res.render("admin/login", { message: "Login failed" || "" });
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
    const users = await User.find({});

    console.log("consolling users:", users);

    return res.render("admin/usermanage", { users });
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
      return res.status(404).send("User not found");
    }

    res.render("admin/userupdate", { user });
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

    console.log(user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingUser = await User.findOne({ email, _id: { $ne: id } });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email already in use by another user" });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();

    res.redirect("/admin/usermanage");
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the user." });
  }
};
//----------- Ban user ------------------------
const banUser = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    user.isBan = !user.isBan;

    await user.save();

    res.redirect("/admin/usermanage");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error banning user");
  }
};
// --------------------------------------------
// --------------------------------------------
// --------------------------------------------



// --------------------------------------------
// ---------Product Manage --------------------
// --------------------------------------------

const loadProductManage = async (req, res) => {
  try {
    
    const products = await Product.find({isDeleted:false})

    res.render("admin/productmanage", { products });
  } catch (error) {
    console.log("productmanage page not found");
    res.status(500).send("server error");
  }
};

const loadProductUpdate = async (req, res) => {
  try {
    const id = req.params.id;
  
  
  
   
    const categories = await Category.find({ isDeleted: false });
    const products = await Product.findOne({ _id: id, isDeleted: false });

    res.render("admin/productupdate", { products,categories });
  } catch (error) {
    console.error("Error loading product:", error);
    res.status(500).json({ message: "Failed to load product" });
  }
};

const productUpdate = async (req, res) => {

  try {
    const {
      id,
      productname,
      category,
      brand,
      price,
      stock,
      warranty,
      color,
      description,
      rating,
    } = req.body;

  
    if (!req.files || req.files.length < 3) {
      return res.status(400).json({ error: 'Exactly 3 images are required.' });
    }



    let images = req.files.map(file=>file.filename);
    
   

   
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        productname,
        category,
        brand,
        price,
        stock,
        warranty,
        color,
        description,
        rating,
        image:images,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.redirect("/admin/productmanage")


     } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

const loadProductcreate = async (req, res) => {
  try {

    const categories = await Category.find({isDeleted: false})


    res.render("admin/productcreate",{categories});
  } catch (error) {
    console.log("productcreate page not found");
    res.status(500).send("server error");
  }
};

const Productcreate = async (req, res) => {
  
  
  try {
    
    

    const {
      productname,
      category,
      brand,
      price,
      stock,
      warranty,
      color,
      description,
      rating,
      ram,
      storage,
     
    } = req.body;
    console.log(category,brand)

    const categoryId = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') },
    isDeleted:false });


    console.log(categoryId)

  if(!categoryId){
    console.log('categoryId is null')
  }
    

    let images = req.files.map(file=>file.filename);
  
    
  
    const newProduct = new Product({
      productname,
      category,
      categoryId:categoryId._id,
      brand,
      price,
      stock,
      warranty,
      color,
      description,
      rating,
      ram,
      storage,
      image:images,
    });
      
       
    await newProduct.save();
    res.redirect("/admin/productmanage");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error while creating the product");
  }
};

const loadProductview = async (req, res) => {
  const id = req.params.id;
  const product = await Product.find({ _id: id ,
    isDeleted:false});

  try {
    res.render("admin/productview", { product });
  } catch (error) {
    console.log("productview page not found");
    res.status(500).send("server error");
  }
};

const productDelete = async (req,res)=>{
  try {

console.log("productdelete")

    const productId = req.params.id
 
    await Product.findByIdAndUpdate(productId, { isDeleted: true });
    res.json({ success: true})
    
  } catch (error) {
    console.log(error);
    res.status(500).send("server error");
  }
}

//----------------------------------------------
//----------------------------------------------
//----------------------------------------------



// ----------------------------------------------
// --------------category manage-----------------
// ----------------------------------------------


const loadCategoryManage = async (req, res) => {
  try {


const categories = await Category.find({isDeleted:false})


    res.render("admin/categorymanage",{ categories });
  } catch (error) {
    console.log("categorymanage page not found");
    res.status(500).send("server error");
  }
};

const loadCategoryCreate = async (req,res)=>{

try {
  const category = await Category.find({
    isDeleted:false})

  console.log(category)




  res.render('admin/categorycreate',{category})
  
} catch (error) {
  console.log("categorycreate page not found");
    res.status(500).send("server error");
}


};

const categoryCreate = async (req,res)=>{
try {
  
const {id,name , status , count } = req.body 

console.log(name,status,count,id)
const newCategory = new Category({
  name, 
  status,
  count,
});


await newCategory.save()

res.redirect('/admin/categorymanage')
 
} catch (error) {
  console.log(error);
    res.status(500).send("server error");
}


};

const loadCategoryUpdate = async (req,res)=>{


  try {
   const id = req.params.id
    const category = await Category.find({_id:id,
      isDeleted:false});
   
    
   console.log(category)
   
    res.render('admin/categoryupdate',{category})
    
  } catch (error) {
    console.log("categoryupdate page not found");
    res.status(500).send("server error");
    
  }
};

const CategoryUpdate = async (req, res)=>{



try {
  const { name, status, count, id } = req.body;


  
    const updatedCategory = await Category.findOneAndUpdate(
      { _id: id },  
      { name, status, count },  
      { new: true } 
    )
    if (!updatedCategory) {
      return res.status(404).send("Category not found");
    }
    
    res.redirect('/admin/categorymanage')
} catch (error) {
  
  
  console.log(error);
  
    res.status(500).send("server error");
}


};

const categoryDelete = async (req,res)=>{
console.log('nfnew')
  
  try {
    const itemId = req.params.id;
    console.log(itemId)
    await Category.findByIdAndUpdate(itemId, { isDeleted: true });
    res.json({ success: true})
  } catch (error) {
      res.status(500).send('Error deleting item');
  }
};

// ------------------------------------------------
// ------------------------------------------------
// ------------------------------------------------



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
  productUpdate,
  loadCategoryCreate,
  categoryCreate,
  loadCategoryUpdate,
  CategoryUpdate,
  categoryDelete,
  productDelete,
 
};
