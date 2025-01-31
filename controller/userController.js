const userSchema = require("../models/usermodel");
const Product = require("../models/productmodel");
const Order = require ("../models/orderdetails")
const Cart = require("../models/cartpagemodel")
const Address = require("../models/addressmodel")
const Category = require("../models/categorymodel")
const Orders  = require("../models/orderdetails")
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const path = require('path')
const fs = require ('fs');
const mongoose = require("mongoose")
const dotenv = require('dotenv');
const session = require("express-session");
const { request } = require("http");
const { log } = require("util");

dotenv.config();



// ================== home page =================
const loadHome= async (req,res)=>{
  try {

    const product = await Product.find({
      isDeleted:false})

const message = req.flash("cart")

    const category = await Category.find({
      isDeleted:false})

      const user = req.session?.details 
      const email = req.session?.details?.email
      console.log(email);
       
      const userr = await userSchema.findOne({email})

      
      console.log('Fetched Products:', product);
     
     res.render('user/user_home',{ product, category,user,userr , message })


    
     console.log("category",category)
     
  } catch (error) {
    console.log('user home error:', error);
  }
    
   
}

const Logout = async (req, res)=>{

 req.session.destroy()
 res.redirect("/")


}

const productView = async(req,res)=>{

try {

  const id = req.params.product_id
  const objectId = new mongoose.Types.ObjectId(id);

  if (!mongoose.Types.ObjectId.isValid(objectId)) {
    return res.status(400).send('Invalid Product ID');
}

const allproduct =await Product.find({})
  const product = await Product.find({_id:objectId})
  const user = await userSchema.find({})
  console.log(typeof product)
  const category = await Category.find({
    isDeleted:false})


  res.render('user/productview', { product,allproduct,category,user})
  
} catch (error) {
  console.log('user productView error:', error);
}



}

const productList = async (req,res)=>{

try {

  
            const message =  req.flash("count")

  const product = await Product.find({isDeleted:false})
  const category = await Category.find({
    isDeleted:false})
    const user = await userSchema.find({})
  console.log(product.length)
  res.render('user/productlist',{product,category,user ,message} )
} catch (error) {
  console.log('user productList error:', error);
}

}

const banPage = async (req,res)=>{


  try {

    res.render("user/banuser")
    
  } catch (error) {

    console.log(error)
    
  }
}

//===============================================
//================ user register ================
//===============================================
  const loadSignUp = async (req, res) => {
    
    
    try {

     

      const message = req.flash('success');
      const cliend_id = process.env.GOOGLE_CLIENT_ID || ""
      res.render('user/usersignup',{message ,cliend_id}); 
    } catch (error) {
      console.log('user signup error:', error);
    }
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000); 
};

// ------------------ User sign up---------------
const signUp = async (req, res) => {
  try {
    console.log("sdad")
    const { email, password, name, Confirmpassword } = req.body;
    const user = await userSchema.findOne({ email });

    if (user) {
      req.flash("success", "User already exists.");
      return res.redirect("/signup");
    }

    const otp = generateOTP();
    const timestamp = Date.now();

    console.log("timer",timestamp)
    req.session.otp = otp;
    req.session.type = "signup";
    req.session.timestamp = timestamp;
    req.session.details = { email, password, name };

    sendOtpEmail(email, otp);
    console.log("Signup OTP created:", req.session.otp);
    console.log("OTP:", otp);

    return res.redirect("/otp");
    
  } catch (error) {
    console.error("Error in signup:", error);
    req.flash("error", "An error occurred. Please try again.");
    return res.redirect("/signup");
  }
};

//------------------- OTP Page ------------------
const loadOtp = async (req, res) => {
  try {
    const OTP =req.flash('OTP')
    res.render('user/otpverify',{OTP}); 
  } catch (error) {
    console.log('user otpverify error:', error);
  }
};

//------------------- Generate OTP ---------------


//------------------ send OTP to email ------------
const sendOtpEmail = (email, otp) => {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Your OTP Verification Code', 
   html: `
      <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background-color: #f4f7fc;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 30px auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .header h1 {
              color: #4CAF50;
              font-size: 24px;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              color: #4CAF50;
              text-align: center;
              margin-top: 20px;
            }
            .message {
              font-size: 16px;
              text-align: center;
              margin-top: 10px;
              color: #555;
            }
            .footer {
              font-size: 14px;
              text-align: center;
              margin-top: 30px;
              color: #777;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              font-size: 16px;
              color: #fff;
              background-color: #4CAF50;
              text-decoration: none;
              border-radius: 4px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Our Service!</h1>
            </div>
            <div class="message">
              <p>Your OTP verification code is:</p>
              <div class="otp-code">${otp}</div>
            </div>
            <div class="footer">
              <p>This OTP is valid for 5 minutes. If you did not request this, please ignore this message.</p>
            </div>
            
          </div>
        </body>
      </html>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending OTP email:', error);
    } else {
      console.log('OTP sent: ' + info.response);
    }
  });
};

//--------------- Nodemailer  transporter----------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

//--------------- Resend OTP ----------------------
const resendOtp = async (req, res) => {

  try {
    const  email  = req.session.details?.email
   
    let newOtp;
    do {
      newOtp = generateOTP();
    } while (newOtp === req.session.otp);

    
    req.session.otp = newOtp;
    req.session.timestamp = Date.now();  
   
    
console.log("resend otp",newOtp)
    
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Your New OTP Verification Code',
      html: `<h2>Your new OTP is: <b style="color:green;">${newOtp}</b></h2>`,
    });
    res.redirect('/otp')
   
  } catch (error) {
    console.error('Error resending OTP:', error);
    req.flash("OTP","Enter email Again")
    res.status(500).redirect("/otp");
  }
};

//----------------- verify OTP---------------------
const verifyOTP = async (req, res) => {
  const { otp } = req.body;
  const currentTime = Date.now();
  console.log("OTP entered:", otp);
  console.log("OTP in session:", req.session.otp);

  if (parseInt(otp) !== req.session.otp) {
    console.log("Invalid OTP entered:", otp);
    req.flash("OTP", "Invalid OTP. Please try again.");
    return res.redirect("/otp");
  }

  // Check if session data exists
  if (req.session.otp && req.session.timestamp && req.session.type) {
    const otpAge = currentTime - req.session.timestamp;
    const isExpired = otpAge >= 60000;  

    

console.log("OTP expiry check:", otpAge);
console.log("Is OTP expired:", isExpired);


    if (isExpired) {
      console.log("OTP has expired. Age:", otpAge, "Time now:", currentTime);
      req.flash("OTP", "OTP has expired.");
      return res.redirect("/otp");
    }

    const workflowType = req.session.type;
    
    console.log("Session type is:", workflowType);

    if (workflowType === "signup") {
      const data = req.session.details;

      try {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const newUser = new userSchema({
          email: data.email,
          password: hashedPassword,
          name: data.name,
        });

        await newUser.save();

       
        ;
        delete req.session.otp;
        delete req.session.timestamp;
        delete req.session.details;
        delete req.session.type;

        req.flash("error", "User registered successfully.");
        return res.redirect("/signin");
      } catch (error) {
        console.error("Error saving user:", error);
        req.flash("OTP", "Error creating account. Please try again.");
        return res.redirect("/otp");
      }
    } else if (workflowType === "forgot") {
      try {
        const user = await userSchema.findOne({ email: req.session.forgot });
        if (!user) {
          console.log("User not found for email:", req.session.forgot);
          req.flash("OTP", "User not found.");
          return res.redirect("/forgot");
        }

        // Clean up session OTP data after successful verification
        delete req.session.otp;
        delete req.session.timestamp;
        delete req.session.type;

        return res.render("user/resetpassword");
      } catch (error) {
        console.error("Error processing forgot password:", error);
        req.flash("OTP", "Error resetting password. Please try again.");
        return res.redirect("/otp");
      }
    }
  } else {
    console.log("Session data not available or expired OTP.");
    req.flash("OTP", "OTP generation failed. Please try again.");
    return res.redirect("/otp");
  }
};

// ===============================================
// ===============================================
// ===============================================






//===============================================
// ============ Google Auth Sign Up =============
// ==============================================

const authsignup=async(req,res)=>{
 

  const data = req.body.data
  const email=data.email
  const user = await userSchema.findOne({email});
  console.log(user);
    


   
  if(user){
    return res.json({ status: 'not done' });
  }else{
    console.log(data)
  const newUser = new userSchema({
    email:data.email,
    name:data.name,
    image:data.imageUrl
  });
  req.session.details={email}
  req.session.logged=true
  newUser.authuser = true;
  await newUser.save();
  res.redirect(302, '/');
  }



 
}

const authsignin = async (req,res)=>{

  const data = req.body.data
  const email=data.email
  const user = await userSchema.findOne({email});
  
  console.log(user);

  
  if(!user){
    return res.status(404).json({ status: 'not done',message:'user not found' });
  }

  if(user.isBan === true){
    
    return res.status(401).json({ message:'user banned By Admin'});
  }
 
  req.session.details={email}
  req.session.logged=true

  res.redirect(302, '/');


}

// =================================================
// =================================================
// =================================================





//==============================================
//=============== user login ====================
//==============================================
const loadSignIn = async (req, res) => {

  
    try {
      
      const error = req.flash('error');
      
      
      const cliend_id =process.env.GOOGLE_CLIENT_ID
      
      res.render('user/usersignin',{ error,cliend_id }); 
    } catch (error) {
      console.log('user signin error:', error);
    }
};

const signIn = async (req, res) => {
    try {
     
    
  
    
      const { email, password } = req.body;
  
      
      if (!email || !password) {
        req.flash('error', 'All fields are required!');
        return res.redirect("/signin");
      }


      
  
    
      const user = await userSchema.findOne({ email});

      
      if (!user) {
        req.flash('error', 'User not found!');
        return res.redirect("/signin");
      }
      
      if(user.isBan === true ){
        req.flash('error', 'User Banned By Admin !');
        return res.redirect("/signin");
      }

      if(user.authuser === true ){
        req.flash('error', 'You Are Only Allowed Google Auth Login');
        return res.redirect("/signin");
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        req.flash('error', 'Incorrect Password!');
        return res.redirect("/signin");
      }
  
      
      req.session.user = user._id; 
      req.session.details={email}
      req.session.logged=true
  
      
      res.redirect("/"); 
    } catch (error) {
      console.error(error);
      req.flash('error', 'Something went wrong!');
      res.redirect("/signin");
    }
};
  
// =============================================
// =============================================
// =============================================




// ==============================================
// ================ Forgot Password =============
// ==============================================
const loadForgot = async (req, res) => {
    try {
      const message = req.flash("message")
      
      res.render('user/forgotpassword',{message}); 
    } catch (error) {
      console.log('user forgotpassword error:', error);
    }
};

const forgot = async (req, res) => {
    try {
      const { email } = req.body;
      const user = await userSchema.findOne({ email });


      if (email == "") {
        req.flash("message", "This Field Are Require");
        return res.redirect("/forgot");
      }
  
      if (!user) {
        req.flash("message", "This user does not exist.");
        return res.redirect("/forgot");
      }

     
  
      const otp = generateOTP();
      const timestamp = Date.now();
  
     
      req.session.otp = otp;
      req.session.type = "forgot";
      req.session.timestamp = timestamp;
      req.session.forgot = email;
  
      sendOtpEmail(email, otp);
      console.log("Forgot password OTP created:", req.session);
      console.log("OTP:", otp);
  
      return res.render("user/otpverify");
    } catch (error) {
      console.error("Error in forgot password:", error);
      req.flash("message", "An error occurred. Please try again.");
      return res.redirect("/forgot");
    }
};

const loadReset = async (req, res) => {
    try {
          

 

      res.render('user/resetpassword'); 
    } catch (error) {
      console.log('user resetpassword error:', error);
    }
};

  const reset = async (req, res) => {
    try {
      const email = req.session.forgot;
      
  
      const user = await userSchema.findOne({ email });
   
  
      if (!user) {
        req.flash('error', 'User not found');
        return res.redirect('/reset'); 
      }
  
      const { newpassword, newconfirmpassword } = req.body;
      
  
      if (newpassword !== newconfirmpassword) {
        req.flash('error', 'Passwords do not match');
        return res.redirect('/reset');
      }
  
      const hashedPassword = await bcrypt.hash(newpassword, 10);
  
      user.password = hashedPassword;
      await user.save();
  
    
  
      req.flash('error', 'Password reset successfully');
      res.redirect('/signin'); 
    } catch (error) {
      console.error("Error in reset function:", error);
      res.status(500).send('Server Error');
    }
};

// ===============================================
// ===============================================
// ===============================================


const loadCart = async (req, res) => {
  try {
    const email = req.session?.details?.email;
    if (!email) return res.redirect('/login');

    const user = await userSchema.findOne({ email });
    if (!user) return res.redirect('/login');

    const page = parseInt(req.query.page) || 1; // Current page
    const limit = 4; // Items per page
    const skip = (page - 1) * limit;

    const cart = await Cart.findOne({ userId: user._id }).populate({
      path: 'items.productId',
      model: 'Product',
    });

    if (!cart || !cart.items.length) {
      return res.render('user/cart', {
        items: [],
        currentPage: 0,
        totalPages: 0,
        totalItems: 0,
      });
    }

    req.session.buyCheck = "Cart";

    const totalItems = cart.items?.length; // Total number of items
    const paginatedItems = cart.items?.slice(skip, skip + limit); // Items for current page
    const totalPages = Math.ceil(totalItems / limit); // Total pages

    const totalValue = cart.items.reduce((sum, item) => {
      const price = parseFloat(item.productId?.price.replace(/,/g, '')); // Convert price to a number
      return sum + price * item?.quantity;
    }, 0);

    res.render('user/cart', {
      items: paginatedItems,
      user,
      currentPage: page,
      totalPages,
      totalItems,
      totalValue: totalValue.toFixed(2),
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

const Carts = async (req, res) => {
  try {
    const email = req.session?.details?.email;
    const user = await userSchema.findOne({ email });
    const userId = user?._id;
    const { productId, quantity } = req.body;

    const parsedQuantity = Number(quantity);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found.");
    }

    let cart = await Cart.findOne({ userId }).populate('items.productId');
    
    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ productId, quantity: parsedQuantity }],
      });
      await cart.save();
      return res.redirect('/cart');
    }

    let itemFound = false;

    // Check each item in the cart
    for (let i = 0; i < cart.items.length; i++) {
      if (cart.items[i].productId.toString() === productId) {
        const newQuantity = cart.items[i].quantity + parsedQuantity;

        if (newQuantity > 5) {
          req.flash("cart","You cannot add more than 5 items of this product.")
          return res.redirect('/');
        } else {
          cart.items[i].quantity = newQuantity;
          itemFound = true;
        }
        break;
      }
    }

    if (!itemFound) {
      if (parsedQuantity > 5) {
        req.flash("cart","You cannot add more than 5 items of this product.")
        return res.redirect('/');
      }
      cart.items.push({ productId, quantity: parsedQuantity });
    }

    await cart.save();
    req.session.buyCheck = "Cart";  
    return res.redirect('/cart');
    
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

const cartDelete = async (req,res)=>{

try {

  const { userid, productid } = req.query;

  const productId = new  mongoose.Types.ObjectId(productid)

  console.log("pppppppppppppppppp",productId)

   const newcart = await Cart.findOneAndUpdate(
    { userId: userid }, 
    { $pull: { items: { productId: productid } } }, 
    { new: true } 
  );

  console.log("newcaaart",newcart )

  res.redirect("/cart")
  
} catch (error) {

  console.log(error)
  
}
}

const loadWhishlist = async (req,res)=>{

try {
  
  const user = req.session?.details 


res.render("user/wishlist",{user})

} catch (error) {

  console.log(error)
}


}
  
const loadProfile = async (req,res)=>{

try {

  const id = req.params.id
  // console.log("id",id)
console.log(req.session)
const orders = await Order.find({ customerId: id })
  .populate({
    path: 'items.productId', // Path to populate
    select: 'productname price' // Select only the fields you need (in this case, the name of the product)
  })
  .exec();

  const user = await userSchema.findOne({_id:id})
  const address = await Address.find({userId:id})
  

  res.render("user/profile",{user,id,address,orders})
  
} catch (error) {

  console.log(error)
 
  
}


}

const addAddress = async (req,res)=>{
  try {

    console.log(req.body)
    const {postalCode,country,state,phone,city,street,id} =req.body


   const address = new Address({

    postalCode,
    country,
    state,
    phone,
    city,
    street,
    userId:id
   })

   address.save()

   res.redirect(`/profile/${id}`)
    
  } catch (error) {
    
    console.log(error)
  }

  

}

const removeAdrress = async (req,res)=>{

    const userId = req.params.id; 
    const addressId =req.query.address;


    await Address.findByIdAndDelete(addressId);

    res.redirect(`/profile/${userId}`)

}

const editAddress = async (req,res)=>{

const {adressaId,street,city,state,Country,postalCode,phone,userId} = req.body


console.log(userId)

 const updatedAddress = await Address.findByIdAndUpdate(
      adressaId,
      {

        street,city,
        state,
        Country,
        postalCode,
        phone

      })

res.redirect(`/profile/${userId}`)

}

const editProfile = async (req, res) => {
    try {
        const { userId, name, email, password, phone, } = req.body;

        console.log("00000000000000 ",req.file)


                 
        const hashedPassword = await bcrypt.hash(password, 10);
      
        const user = await userSchema.findById(userId);
        console.log("user",user)

       
        let images;
        if (req.file) {
          const uploadPath = path.join(__dirname, '../uploads/', req.file.originalname);
          fs.writeFileSync(uploadPath, req.file.buffer); 
          images = '/uploads/' + req.file.originalname;  
        }
     


        // Update fields
        user.name = name || user.name;
        user.email = email || user.email;     
        user.password = hashedPassword|| user.password 
        user.image = images||user.image
        user.phone = phone|| user.phone

      
        // Save changes
        await user.save();

        res.redirect(`/profile/${userId}`)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const buyNow = async (req, res) => {
  try {
    req.session.buyCheck = "buyNow";
    const id = req.params.id;
    const { qty } = req.query;

    const email = req.session?.details?.email;
    if (!email) return res.redirect('/signin');

    const product = await Product.findById({ _id: id });
    const user = await userSchema.findOne({ email });
    if (!user) return res.redirect('/signin');

    const address = await Address.find({ userId: user._id });
    const totalItems = 1;
    const productPrice = parseFloat(product.price.replace(/,/g, ''));
    const quantity = parseFloat(qty);
    const totalValue = productPrice * quantity;

    const message = req.flash('count')

    // Here you should pass an array of cartItems or just the single product
    const cartItems = [{ productId: product, quantity: qty, }];
    
    res.render("user/checkout", {
      address,
      product,
      message,
      totalValue,
      totalItems,
      user,
      cartItems,
      quantity // Pass cartItems instead of product
    });

  } catch (error) {
    console.log(error);
  }
};

const loadCheckout = async (req,res)=>{


  try {

    const check = req.session?.buyCheck
    const message = req.flash('count')

    if(!check){
      res.redirect("/")  
    }

    console.log("////////check",check);
    

    if(check ==="Cart"){

      const email = req.session?.details?.email;
      if (!email) return res.redirect('/login');
  
      const user = await userSchema.findOne({ email });
      if (!user) return res.redirect('/login');
  
  
      const address = await Address.find({userId:user._id})
      
      console.log("adress/////////////",address)
  
      const cartItems = await Cart.findOne({ userId: user._id }).populate({
        path: 'items.productId',
        model: 'Product',
      });

      console.log("sssssssss",cartItems)
      const totalItems = cartItems?.items.length; 
      const totalValue = cartItems?.items.reduce((sum, item) => {
        const price = parseFloat(item.productId.price.replace(/,/g, ''));
        const quantity = Number(item.quantity); // Convert to a number
        return sum + price * quantity;
      }, 0);
  
      res.render("user/checkout",{totalItems,cartItems,totalValue,address,user,product:cartItems,message})

    }

      if(check === "buyNow"){
        const email = req.session?.details?.email;
        if (!email) return res.redirect('/login');
    
        const user = await userSchema.findOne({ email });
        if (!user) return res.redirect('/login');
    
    
        const address = await Address.find({userId:user._id})
    
        console.log("check/////////////",check)
    
      const cart = await Cart.findOne({ userId: user._id }).populate({
        path: 'items.productId',
        model: 'Product',
      });

      res.render("user/checkout",{address,user,message})
    }

   
    
  } catch (error) {

    console.log(error)
    
  }
}

const CheckOut = async (req, res) => {
  try {
    const { customerId, totalValue, paymentMethod,catqty,cartid, country,name, street, city, state, postcode, phone } = req.body;

    console.log("lll",catqty);
    
    

    
    const formattedCustomerId = customerId.trim();

    if (!mongoose.Types.ObjectId.isValid(formattedCustomerId)) {
      return res.status(400).json({ error: "Invalid customerId format" });
    }


    if (!totalValue) {
      return res.status(400).json({ error: "Total amount is required" });
    }

    let items = [];

    
    if (catqty && catqty.length > 1) {
      items = catqty.map((quantity, index) => ({
        productId: new mongoose.Types.ObjectId(cartid[index]), 
        quantity: quantity
      }));
    } else{
      items = [{
        productId: new mongoose.Types.ObjectId(cartid),  
        quantity: Number(catqty) || 1 
      }];

    }
    
    for (const item of items) {
      const product = await Product.findById(item.productId); 
      if (product) {
        if (product.stock > item.quantity) {
          product.stock -= item.quantity; 
          await product.save();
        } else {

          req.flash("count","Not enough stock for this product")
         res.redirect("/productlist")
        }
      } else {
        return res.status(404).json({ error: `Product with ID ${item.productId} not found` });
      }
    }
    

    const billingAddress = { country, street, city, state, postcode, phone,name };

    const newOrder = new Orders({
      customerId: formattedCustomerId,
      totalAmount: totalValue,
      paymentMethod: paymentMethod || "Cash on Delivery",
      billingAddress,
      items
    })

    await newOrder.save();

    console.log("customerId",customerId);
    


    res.render("/ordersuccess",{ userid: customerId.trim() })
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

const OrderView = async (req, res) => {
  try {
    const { orderId, productId } = req.params;

    console.log("Fetching Order Details...");

    // Find the order and populate necessary fields
    const order = await Order.findById(orderId)
  .populate("items.productId")
  .populate("customerId")


  

    if (!order) {
      console.log("Order not found");
     
    }

    console.log("Order Found:", order.items);

    console.log("All Product IDs in Order:", order.items.map(i => i.productId._id.toString()));

    // Find the specific item in the order
    const item = order.items.find(i => i.productId._id.toString() === productId);

    console.log("ssssssssssss",item);

    if (!item) {
      console.log("Product not found in order");
     
    }
console.log("sssssssssssss",item);

    // Render the order details page
    res.render("user/order-details", { order, item ,user: order.customerId });
  } catch (error) {
    console.error("Error fetching order details:", error.message);
    res.status(500).send(`Error fetching order details: ${error.message}`);
  }
};

const cancellOrder = async (req, res) => {
  try {
    console.log("Request received for updating order status");

    const orderId = req.query.orderId;
    const newStatus = req.query.newStatus;
    const productId = req.query.productId;

    console.log("Received Data:", { orderId, newStatus, productId });

    // Find the order
    const order = await Order.findById(orderId)
      .populate("items.productId")
      .populate("customerId");

    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Find the specific item with the given productId
    const itemToUpdate = order.items.find(
      (item) => item.productId._id.toString() === productId
    );

    if (!itemToUpdate) {
      return res.status(404).send("Product not found in order");
    }

    // Update the shipping status only for the correct product
    itemToUpdate.shippingDetails.status = newStatus;
    
    // Ensure Mongoose detects the change
    

    // Save the updated order
    await order.save();

    console.log("Updated status:", itemToUpdate.shippingDetails.status);

    res.redirect(`/orderview/${orderId}/${productId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const orderSuccess = async(req,res)=>{

  try {

    res.render('user/ordersuccess')
    
  } catch (error) {
    console.log(error)
    
  }
} 

  







  module.exports={
    authsignup,
    authsignin,
    loadHome,
    loadSignUp,
    loadSignIn,
    loadForgot,
    loadOtp,
    loadReset,
    signUp,
    signIn,
    verifyOTP,
    resendOtp,
    productView,
    productList,
    Logout,
    banPage,
    loadCart,
    loadWhishlist,
    forgot,
    reset,
    loadProfile,
    addAddress,
    removeAdrress,
    editAddress,
    editProfile,
    Carts,
    loadCheckout,
    cartDelete,
    buyNow,
    CheckOut,
    OrderView,
    cancellOrder,
    orderSuccess

  }