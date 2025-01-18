const userSchema = require("../models/usermodel");
const Product = require("../models/productmodel");
const Address = require("../models/addressmodel")
const Category = require("../models/categorymodel")
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const mongoose = require("mongoose")
const dotenv = require('dotenv');
const session = require("express-session");
const saltround =10
dotenv.config();



// ================== home page =================
const loadHome= async (req,res)=>{
  try {

    const product = await Product.find({
      isDeleted:false})
    const category = await Category.find({
      isDeleted:false})

      const user = req.session?.details 
      const email = req.session?.details?.email
      console.log(email);
       
      const userr = await userSchema.find({email})

      console.log()

     
     res.render('user/user_home',{ product, category,user,userr })
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

  


  const product = await Product.find({isDeleted:false})
  const category = await Category.find({
    isDeleted:false})
    const user = await userSchema.find({})
  console.log(product.length)
  res.render('user/productlist',{product,category,user} )
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

    
    req.session.otp = otp;
    req.session.type = "signup";
    req.session.timestamp = timestamp;
    req.session.details = { email, password, name };

    sendOtpEmail(email, otp);
    console.log("Signup OTP created:", req.session);
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
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000); 
};

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
    const  email  = req.session.details.email
   
    let newOtp;
    do {
      newOtp = generateOTP();
    } while (newOtp === req.session.otp);

    
    req.session.otp = newOtp;
    req.session.timestamp = Date.now(); 
   
    

    
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Your New OTP Verification Code',
      html: `<h2>Your new OTP is: <b style="color:green;">${newOtp}</b></h2>`,
    });
    res.redirect('/otp')
   
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ error: 'Failed to resend OTP. Try again.' });
  }
};

//----------------- verify OTP---------------------
const verifyOTP = async (req, res) => {
  const { otp } = req.body;
  const currentTime = Date.now();

  if (parseInt(otp) !== req.session.otp) {
    req.flash("OTP", "Invalid OTP. Please try again.");
    return res.redirect("/otp");
  }

  if (req.session.otp && req.session.timestamp && req.session.type) {
    const otpAge = currentTime - req.session.timestamp;
    const isExpired = otpAge >= 30000; 



    if (isExpired) {
      req.flash("OTP", "OTP has expired.");
      return res.redirect("/otp");
    }

   

    const workflowType = req.session.type;

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

       
        req.session.logged = true;
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
          req.flash("OTP", "User not found.");
          return res.redirect("/forgot");
        }

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
  }

  req.flash("OTP", "OTP generation failed. Please try again.");
  return res.redirect("/otp");
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
      
      if(user.isBan === true){
        req.flash('error', 'User Banned By Admin !');
        return res.redirect("/signin");
      }

      if(user.authuser === true){
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
  

  const loadCart = async (req,res) =>{

    try {

      const user = req.session?.details 


      res.render("user/cart",{user})
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

  const user = await userSchema.findOne({_id:id})
  const address = await Address.find({userId:id})
  // console.log("user",user)
  

  res.render("user/profile",{user,id,address})
  
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



const   editProfile = async (req, res) => {
  const { userId,image } = req.body;

  console.log('Incoming files:', req.files);

  
  console.log("BODY", req.body); 
  console.log("USER ID", userId); 
  console.log("image", image); 
   
};



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
    editProfile

  }