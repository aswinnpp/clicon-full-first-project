const User = require("../models/usermodel");
const bcrypt = require("bcrypt");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel")
const path = require('path')
const fs = require ('fs');
const mongoose =require("mongoose")
const { v4: uuidv4 } = require('uuid');
const router = require("../routes/admin");
const { log } = require("console");


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
const adminLogout = async (req, res)=>{
  console.log("dmm")

  req.session.destroy()
  res.redirect("/admin/login")
 
 
 }

// --------------------------------------------
// ----------- User Management-----------------
// --------------------------------------------
const loadUserManage = async (req, res) => {
  try {

    const message = req.flash("success");
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit; 

  
    const users = await User.find({role:'user'}).skip(skip).limit(limit);
    const totalUsers = await User.countDocuments();

    const totalPages = Math.ceil(totalUsers / limit);

    
console.log(totalPages)
  
    res.render("admin/usermanage", {
      users,
      currentPage: page,
      totalPages,
      message,
      limit
    });

  } catch (error) {
    console.log("error");
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



  try {
    const userId = req.params.id;
    const { isBan } = req.body; 
    
   

    
    const updatedUser = await User.findByIdAndUpdate(userId, { isBan:!isBan });
    

    res.json({ success: true });

   
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
    const message = req.flash("success");
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit; 

  
    const products = await Product.find({}).skip(skip).limit(limit);
    const totalProduct = await Product.countDocuments();
    const totalPages = Math.ceil(totalProduct / limit);

  
    res.render("admin/productmanage", {
      products,
      currentPage: page,
      totalPages,
      message,
      limit
    });
  } catch (error) {
    console.log("productmanage page not found");
    res.status(500).send("server error");
  }
};

const loadProductUpdate = async (req, res) => {
  try {
    const id = req.params.id;
  
  
    if (!id  || !mongoose.Types.ObjectId.isValid(id )) { 
      return res.status(404).render('admin/404')
     }
   
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
  

    const croppedImages = Object.keys(req.body).filter((key) =>
      key.includes('_cropped')
    );

    
    const croppedImageFilenames = {};
    croppedImages.forEach((imageKey) => {
      const base64Data = req.body[imageKey];
      const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
      if (matches) {
        const extension = matches[1];
        const base64String = matches[2];
        const filename = `${imageKey}-${Date.now()}.${extension}`;
        const filepath = path.join(__dirname, '../uploads', filename);

        
        fs.writeFileSync(filepath, Buffer.from(base64String, 'base64'));
        croppedImageFilenames[imageKey] = filename;
      }
    });

    const {
      id,
      productname,
      category,
      brand,
      offer,
      price,
      stock,
      warranty,
      color,
      description,
      rating,
      ram,
      storage
    } = req.body;

    const categoryId = await Category.findOne({
      name: { $regex: new RegExp(`^${category}$`, 'i') },
      isDeleted: false,
    });

    const currentProduct = await Product.findById(id);

    let images = currentProduct.image || [];

   
    for (let i = 0; i < Object.entries(req.files).length; i++) {
      const file = Object.entries(req.files)[i][1][0];
      let lastChar = file.fieldname.slice(-1);
      let u = Number(lastChar);

      const key = `imagePreview${u + 1}_cropped`;
      file.filename = croppedImageFilenames[key] || file.filename;

      images[u] = file.filename;
    }

    let newcolor = color.split(',').map(c => c.trim())
    

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        productname,
        category: categoryId.name,
        brand,
        offer,
        price,
        stock,
        warranty,
        color:newcolor,
        description,
        rating,
        ram:ram.split(',').map(c => c.trim()),
        storage:storage.split(',').map(c => c.trim()),
        image: images,
      },
      { new: true }
    );

    if (!updatedProduct) {
      console.error("Failed to update product.");
      return res.status(404).json({ error: "Failed to update product." });
    }

    console.log("Product updated:", updatedProduct);
    res.redirect('/admin/productmanage');
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: 'Server Error', error: err.message });
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
      offer, 
      price, 
      stock, 
      warranty, 
      color, 
      description, 
      rating, 
      ram, 
      storage 
    } = req.body;

    
    const categoryId = await Category.findOne({
      name: { $regex: new RegExp(`^${category}$`, 'i') },
      isDeleted: false,
    });



   
  let images =[] 
    Object.keys(req.body).forEach((key) => {
      if (key.includes('_cropped')) {
        const base64Image = req.body[key];
    
        
        if (base64Image.startsWith('data:image/')) {
          const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
    
          
          const filename = `image_${uuidv4()}.png`;
          const filepath = path.join(__dirname, '../uploads/', filename);
    
          fs.writeFileSync(filepath, buffer);
    
          images.push(filename);
        }
      }
    });

    let newcolor = color.split(',').map(c => c.trim())

    const newProduct = new Product({
      productname,
      category,
      categoryId: categoryId,
      brand,
      offer,
      price,
      stock,
      warranty,
      color:newcolor,
      description,
      rating,
      ram,
      storage,
      image: images,
    });

    await newProduct.save();
    res.redirect('/admin/productmanage');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error while creating the product');
  }
};
const loadProductview = async (req, res) => {
  try {
    
    const id = req.params.id;
    const product = await Product.find({ _id: id ,
      isDeleted:false});


   

    res.render("admin/productview", { product });
  } catch (error) {
    console.log("productview page not found");
    res.status(404).render('admin/404')
  }
};
const productDelete =  async (req, res) => {

  console.log(req.params.id);

  try {
    const productId = req.params.id;
    const { isDeleted } = req.body; 
    
    
    
    
    await Product.findByIdAndUpdate(productId, { isDeleted:!isDeleted  });

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    
    res.json({ success: false, message: 'Failed to update product status.' });
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

    const message = req.flash("success");
    const page = parseInt(req.query.page) || 1; 
    const limit = 4; 
    const skip = (page - 1) * limit; 

    const categories = await Category.find({}).skip(skip).limit(limit);
    const totalCategory = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategory / limit);

    res.render("admin/categorymanage", {
      categories,
      currentPage: page,
      totalPages,
      message,
      limit
    });
  } catch (error) {
    console.log("categorymanage page not found");
    res.status(500).send("server error");
  }
};

const loadCategoryCreate = async (req,res)=>{

try {
  const category = await Category.find({
    isDeleted:false})


    

   
  console.log("category",category)




  res.render('admin/categorycreate',{category})
  
} catch (error) {
  console.log("categorycreate page not found");
    res.status(500).send("server error");
}


};

const categoryCreate = async (req,res)=>{
try {
  
const {id,name , status , description } = req.body 
  
const checkExist = await Category.find({ name: { $regex: new RegExp('^' + name + '$', 'i') } });



if(checkExist.length>0){

    req.flash( "success","category already exist")
    return res.redirect("/admin/categorymanage")  

}




console.log(name,status,count,id)
const newCategory = new Category({
  name, 
  status,
  description
  
});


await newCategory.save()
req.flash( "success","category create successfully")
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
    
      if (!id  || !mongoose.Types.ObjectId.isValid(id )) { 
        return res.status(404).render('admin/404')
       }
    
   console.log(category)
   
    res.render('admin/categoryupdate',{category})
    
  } catch (error) {
    console.log("categoryupdate page not found");
    res.status(500).send("server error");
    
  }
};

const CategoryUpdate = async (req, res)=>{



try {
  const { name, status,  id, description} = req.body;


  if (!id  || !mongoose.Types.ObjectId.isValid(id )) { 
    return res.status(404).render('admin/404')
   }

const exists = await Category.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') }})


if (exists) {
  // If a category with the same name exists, show a flash message
  req.flash("success", "Category name already exists.");
  return res.redirect('/admin/categorymanage');
}


const updatedCategory = await Category.findOneAndUpdate(
      { _id: id },  
      { name, status,description },  
      { new: true } 
    )

    if (!updatedCategory) {
      req.flash("success", "Category not  found");
        return res.redirect('/admin/categorymanage')
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
  const categoryId = req.params.id;
  const { isDeleted } = req.body; 
  
// const category = await Category.findOne({_id:categoryId})
// console.log(category.count)

if (!categoryId  || !mongoose.Types.ObjectId.isValid(categoryId )) { 
  return res.status(404).render('admin/404')
 }

  await Category.findByIdAndUpdate(categoryId, { isDeleted });
  await Product.updateMany({ categoryId: categoryId }, { isDeleted });



  


  res.json({ success: true });
} catch (error) {
  res.json({ success: false, message: 'Failed to update category status.' });
}
};


// ------------------------------------------------
// ------------------------------------------------
// ------------------------------------------------


const loadOrdermanage = async (req,res)=>{


  try {

    res.render("admin/ordermanage")
    
  } catch (error) {
    
  }
}

const loadCouponmanage = async (req,res) =>{

  try {
    
res.render("admin/couponmanage")


  } catch (error) {
    console.log(error)
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
  productUpdate,
  loadCategoryCreate,
  categoryCreate,
  loadCategoryUpdate,
  CategoryUpdate,
  categoryDelete,
  productDelete,
  adminLogout,
  loadOrdermanage,
  loadCouponmanage
 
};
