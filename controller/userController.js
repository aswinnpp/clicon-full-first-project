const userSchema = require("../models/usermodel");
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const saltround =10
dotenv.config();



// -------------- home page --------------------
const loadHome= async (req,res)=>{
  try {
    return res.render('user/userhome')
  } catch (error) {
    console.log('user home error:', error);
  }
    
   
  }
//  ---------------------------------------------
//  -------------- user register ----------------
//  ---------------------------------------------
  const loadSignUp = async (req, res) => {
    try {
      const message = req.flash('success');
      res.render('user/usersignup',{message}); 
    } catch (error) {
      console.log('user signup error:', error);
    }
  };

  // -------------------User sign up---------------
const signUp = async (req, res) => {
  console.log(req.body); 

 
  
  try {
    const { email, password, name,phone } = req.body;

    const user = await userSchema.findOne({ email });
    if (user) {
      req.flash('success', 'User already exist!');
      return res.redirect("/signup");
    }
    const otp = generateOTP();
    const timestamp = Date.now();

    req.session.otp = otp;
    req.session.timestamp = timestamp;
    req.session.details={email,password,name,phone}

    sendOtpEmail(email, otp);

    console.log('OTP:', otp);

    res.redirect('/otp')

  } catch (error) {
    console.error(error); 
    res.render("/signup",);
  }
};


const loadOtp = async (req, res) => {
  try {
    const OTP =req.flash('OTP')
    res.render('user/otpverify',{OTP}); 
  } catch (error) {
    console.log('user otpverify error:', error);
  }
};

// -----------Generate OTP ----------------------
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000); 
};


// ------------send OTP to email-----------------
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

// --------------Nodemail  transporter------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});


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
    req.session.newOtp = newOtp;
    req.session.newtimestamp = Date.now(); // Update timestamp

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
  // ----------------verifyOTP--------------------
  const verifyOTP = async (req, res) => {
    const { otp } = req.body;

    console.log(otp)
    const currentTime = Date.now();
  
    
    if (req.session.otp && req.session.timestamp||req.session.newotp&& req.session.newtimestamp) {
      const otpAge = currentTime - req.session.timestamp;
      const newotpAge=currentTime - req.session.newtimestamp;
      const isExpired = otpAge > 50000;  
  
      if (isExpired) {
        req.flash('OTP', 'OTP Expired');
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


// -----------------------------------------------
// -----------------------------------------------
// -----------------------------------------------






// -------------- user login--------------------
const loadSignIn = async (req, res) => {
    try {
      
      const error = req.flash('error');
      

      
      res.render('user/usersignin',{ error }); 
    } catch (error) {
      console.log('user signin error:', error);
    }
  };



  const signIn = async (req, res) => {
    try {
      // Debug incoming data
      console.log(req.body);
  
      // Extract form data
      const { email, password, name } = req.body;
  
      // Validation for empty fields
      if (!email || !password || !name) {
        req.flash('error', 'All fields are required!');
        return res.redirect("/signin");
      }
  
      // Check if user exists
      const user = await userSchema.findOne({ email, name });
      if (!user) {
        req.flash('error', 'User not found!');
        return res.redirect("/signin");
      }
  
      // Compare password
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
  
// ----------------------------





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
    loadHome,
    loadSignUp,
    loadSignIn,
    loadForgot,
    loadOtp,
    loadReset,
    signUp,
    signIn,
    verifyOTP,
    resendOtp

  }