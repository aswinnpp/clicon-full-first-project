const express = require("express");
const router = express.Router();
const userController = require("../controller/usercontroller");
const userauth = require("../middleware/userauth");

router.get("/",  userController.loadHome);

router.get("/signup", userController.loadSignUp);
router.post("/signup", userController.signUp);

router.post("/authsignup", userController.authsignup);
router.post("/authsignin", userController.authsignin);

router.get("/signin", userController.loadSignIn);
router.post("/signin", userController.signIn);

router.get("/otp", userController.loadOtp);
router.post("/otp", userController.verifyOTP);
router.post("/resend", userController.resendOtp);

router.get("/forgot", userController.loadForgot);

router.get("/reset", userController.loadReset);

module.exports = router;
