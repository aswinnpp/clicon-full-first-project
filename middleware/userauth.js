const User = require("../models/usermodel");


const checkSession = (req, res, next) => {
    if (req.session.details) {
      next();
    } else {
      res.render("user/usersignin");
    }
  };


 
  const isLogin = (req, res, next) => {
    console.log('gbdfsvdcz'+req .session.logged )
    if (req.session.logged) {
      res.redirect("/");
    } else {
      next();
    }
  };


  const isBan = async (req, res, next) => {
    try {
      
      if(req.session.details){
        const email = req.session.details.email
        const user = await User.findOne({ email })
        if(user?.isBan===true){
          req.session.destroy()
          next()
        }else{
          next()
        }

      }else{
        next()
      }
      
    } catch (error) {
      console.error("Error in isBan middleware:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  module.exports = { checkSession, isLogin ,isBan};