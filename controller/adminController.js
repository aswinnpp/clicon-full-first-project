const User = require("../models/usermodel");
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const Product= require("../models/productmodel")
const path = require('path')
const fs = require('fs');





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


 const productUpdate = async (req, res) => {
  try {
    // Validate Product ID
    const id = req.body.id || req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Product ID' });
    }

    // Find existing product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Extract fields from request body
    const {
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
      croppedImages,
      replaceImages 
    } = req.body;

    let image = replaceImages ? [] : product.image || [];

    
    if (req.files && req.files.length > 0) {
      const uploadedImages = req.files.map(file => `/uploads/${file.filename}`);
      image = replaceImages ? uploadedImages : [...image, ...uploadedImages];
    }

   
    if (croppedImages) {
      try {
        const images = JSON.parse(croppedImages); 
        for (const [index, base64Image] of images.entries()) {
          const buffer = Buffer.from(base64Image.split(',')[1], 'base64');
          const filename = `${Date.now()}-${index}.png`;
          const filePath = path.join(__dirname, '../uploads', filename);

          await fs.promises.writeFile(filePath, buffer);
          image.push(`/uploads/${filename}`);
        }
      } catch (err) {
        console.error('Error processing cropped images:', err);
        return res.status(400).json({ message: 'Invalid cropped image data.' });
      }
    }

 
    product.productname = productname || product.productname;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.price = price || product.price;
    product.offer = offer || product.offer;
    product.stock = stock || product.stock;
    product.warranty = warranty || product.warranty;
    product.color = color || product.color;
    product.description = description || product.description;
    product.rating = rating || product.rating;
    product.image = image;

   
    await product.save();

  
    res.status(200).json({ message: 'Product updated successfully!' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'An error occurred while updating the product.' });
  }
};

const loadProductUpdate = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Product ID" });
    }

    const products = await Product.findById(id);
    if (!products) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.render('admin/productupdate', { products });  
  } catch (error) {
    console.error('Error loading product:', error);
    res.status(500).json({ message: 'Failed to load product' });
  }
};


const loadProductcreate =async (req, res)=>{

  try {

    res.render('admin/productcreate')
    
  } catch (error) {
    console.log("productcreate page not found");
    res.status(500).send("server error");
  }
}


const Productcreate = async (req, res) => {
  try {
    const { 
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
      croppedImages 
    } = req.body;

  
    let image = [];

   
    if (req.files && req.files.length > 0) {
      image = req.files.map(file => `./uploads/${file.filename}`);
    }

    
    if (croppedImages) {
      const images = JSON.parse(croppedImages); 

      images.forEach((base64Image, index) => {
        const buffer = Buffer.from(base64Image.split(",")[1], "base64");
        const filename = `${Date.now()}-${index}.png`; 
        const filePath = path.join(__dirname, "../uploads", filename); 

        fs.writeFileSync(filePath, buffer); 
        image.push(`/uploads/${filename}`);
      });
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

    
    res.redirect("/admin/productmanage");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error while creating the product");
  }
};


const loadProductview = async (req ,res)=>{
  
  const id = req.params.id
  const product = await Product.find({_id:id})


  try {
    
    res.render('admin/productview',{product})

  } catch (error) {
    console.log("productview page not found");
    res.status(500).send("server error");
  }
}


//----------------------------------------------
//----------------------------------------------
//----------------------------------------------





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
  productUpdate,

};
