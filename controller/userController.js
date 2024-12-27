const userSchema = require("../models/usermodel");
const bcrypt = require("bcrypt");


const loadHome= async (req,res)=>{
    res.render('user/userhome')
   
  }
  


  module.exports={
    loadHome

  }