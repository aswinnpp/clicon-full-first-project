const userSchema = require("../models/usermodel");
const bcrypt = require("bcrypt");


const loadHome= async (req,res)=>{
  try {
    return res.render('user/userhome')
  } catch (error) {
    console.log('user home error:', error);
  }
    
   
  }


  const loadSignUp = async (req, res) => {
    try {
      
      res.render('user/usersignup'); 
    } catch (error) {
      console.log('user signup error:', error);
    }
  };
  const loadSignIn = async (req, res) => {
    try {
      
      res.render('user/usersignin'); 
    } catch (error) {
      console.log('user signin error:', error);
    }
  };

  const loadForgot = async (req, res) => {
    try {
      
      res.render('user/forgotpassword'); 
    } catch (error) {
      console.log('user forgotpassword error:', error);
    }
  };
  const loadOtp = async (req, res) => {
    try {
      
      res.render('user/otpverify'); 
    } catch (error) {
      console.log('user otpverify error:', error);
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
    loadReset

  }