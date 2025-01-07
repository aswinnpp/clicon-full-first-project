const userSchema = require("../models/usermodel");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel")
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const mongoose = require("mongoose")
const dotenv = require('dotenv');
const saltround =10
dotenv.config();



// ================== home page =================
const loadHome= async (req,res)=>{
  try {

    const product = await Product.find({
      isDeleted:false})
    const category = await Category.find({
      isDeleted:false})
     res.render('user/user_home',{ product, category })
  } catch (error) {
    console.log('user home error:', error);
  }
    
   
}



const productView= async(req,res)=>{

try {

  const id = req.params.product_id
  const objectId = new mongoose.Types.ObjectId(id);


  const product = await Product.findOne({_id:objectId})
  console.log(product)

  res.render('user/productview', { product})
  
} catch (error) {
  console.log('user productView error:', error);
}



}


const productList = async (req,res)=>{

try {

  


  const product = await Product.find({isDeleted:false})
  console.log(product.length)
  res.render('user/productlist',{product} )
} catch (error) {
  console.log('user productList error:', error);
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
  console.log(req.body); 

 
  
  try {
    const { email, password, name , Confirmpassword } = req.body;

    const user = await userSchema.findOne({ email });
    if (user) {
      req.flash('success', 'User already exist!');
      return res.redirect("/signup");
    }
      if( password !== Confirmpassword){
        req.flash('success', 'Password Not Match');
        return res.redirect("/signup");

      }

    const otp = generateOTP();
    const timestamp = Date.now();

    req.session.otp = otp;
    req.session.timestamp = timestamp;
    req.session.details={email,password,name, Confirmpassword }

    sendOtpEmail(email, otp);
    console.log('sign up otp creation',req.session)
    console.log('OTP:', otp);

    res.redirect('/otp')

  } catch (error) {
    console.error(error); 
    res.render("/signup",);
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
    from: process.env.GMAIL_USER, // Sender address
    to: email, // Receiver's email address
    subject: 'Your OTP Verification Code', // Email subject
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
   console.log(email)
    // Generate a new OTP
    let newOtp;
    do {
      newOtp = generateOTP();
    } while (newOtp === req.session.otp); // Ensure it's not the same as the previous one

    // Update OTP and timestamp in session
    req.session.otp = newOtp;
    req.session.timestamp = Date.now(); // Update timestamp
   
    console.log('resend session creation',req.session)

    // Send the new OTP via email
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

    console.log(req.session)
    const currentTime = Date.now();
  
    
    if (req.session.otp && req.session.timestamp) {
      const otpAge = currentTime - req.session.timestamp;
     
      const isExpired = otpAge == 30000;  
  
      if (isExpired) {
        req.flash('OTP', 'OTP Expired');
        delete req.session.otp
        return res.redirect('/otp')
      
      }
     const data=req.session.details
      
      if (parseInt(otp) === req.session.otp) {
        
        const hashedPassword = await bcrypt.hash(data.password, saltround);
        const newUser = new userSchema({
          email:data.email,
          password: hashedPassword,
          name:data.name,
          phone:data.phone,
        });
  
        await newUser.save();
        console.log(newUser);
  
        // OTP is valid and user is saved
        res.redirect('/');  // Redirect to a welcome page or dashboard
      } else if(parseInt(otp) === req.session.newotp){
        const hashedPassword = await bcrypt.hash(data.password, saltround);
        const newUser = new userSchema({
          email:data.email,
          password: hashedPassword,
          name:data.name,
          phone:data.phone,
        });
  
        await newUser.save();
        console.log(newUser);
  
        // OTP is valid and user is saved
        res.redirect('/');  // Redirect to a welcome page or dashboard
  
      }
      else {
        req.flash('OTP', 'OTP not match')
        return res.redirect('/otp')
      }
    }else {
      req.flash('OTP', 'OTP Generation Failed')
      return res.redirect('/otp')
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
    name:data.name
  });

  newUser.authuser = true;
  await newUser.save();
  
  }

  user.authuser = true
  await user.save();
  res.redirect(302, '/');
}

const authsignin = async (req,res)=>{

  const data = req.body.data
  const email=data.email
  const user = await userSchema.findOne({email});
  console.log(user);

  
  if(!user){
    return res.json({ status: 'not done' });
  }
 


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
     
      console.log(req.body);
  
    
      const { email, password, name } = req.body;
  
      
      if (!email || !password || !name) {
        req.flash('error', 'All fields are required!');
        return res.redirect("/signin");
      }


      
  
    
      const user = await userSchema.findOne({ email});

      
      if (!user) {
        req.flash('error', 'User not found!');
        return res.redirect("/signin");
      }
      
      if(user.isBan === true){
        req.flash('error', 'User Baadminnned By !');
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
      req.session.email = user.email;
  
      
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
      
      res.render('user/forgotpassword'); 
    } catch (error) {
      console.log('user forgotpassword error:', error);
    }
  };

const loadReset = async (req, res) => {
    try {
      
      res.render('user/resetpassword'); 
    } catch (error) {
      console.log('user resetpassword error:', error);
    }
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
    productList

  }