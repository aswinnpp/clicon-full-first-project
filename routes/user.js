const express = require("express");
const router = express.Router();
const userController = require("../controller/usercontroller")
const userauth = require("../middleware/userauth");




router.get('/home',userController.loadHome)
router.get('/signup',userController.loadSignUp)
router.get('/signin',userController.loadSignIn)
router.get('/forgot',userController.loadForgot)
router.get('/otp',userController.loadOtp)
router.get('/reset',userController.loadReset)











module.exports=router;