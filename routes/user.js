const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const userauth = require("../middleware/userauth");

router.get("/", userauth.isBan,  userController.loadHome);

router.get("/signup",userauth.isLogin,  userController.loadSignUp);
router.post("/signup", userController.signUp);


router.get("/logout", userController.Logout)


router.get('/banpage',userController.banPage)


router.post("/authsignup", userController.authsignup);
router.post("/authsignin",userController.authsignin);

router.get("/signin",userauth.isLogin, userController.loadSignIn);
router.post("/signin", userController.signIn);

router.get("/otp",userauth.checkSession,  userController.loadOtp);
router.post("/otp", userController.verifyOTP);
router.post("/resend", userController.resendOtp);

router.get("/forgot", userController.loadForgot);
router.get("/reset" , userController.loadReset);


router.get("/productview/:product_id",userauth.checkSession,userauth.isBan, userController.productView)

router.get("/productlist" ,userauth.checkSession,userauth.isBan, userController.productList)

module.exports = router;
