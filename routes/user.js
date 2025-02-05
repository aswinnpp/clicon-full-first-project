const express = require("express");
const router = express.Router();
const userauth = require("../middleware/userauth");
const multer = require('../utils/multter'); 
const Product = require ("../models/productmodel")


const authController = require("../controller/userController/authController");
const homeController = require("../controller/userController/homeController");
const cartController = require("../controller/userController/cartController");
const orderController = require("../controller/userController/orderController");
const profileController = require("../controller/userController/profileController");
const passwordController = require("../controller/userController/passwordController");
const wishlistController = require("../controller/userController/wishlistController");

router.get("/", userauth.isBan, homeController.loadHome);
router.get("/productview/:product_id", userauth.isBan, homeController.productView);
router.get("/productlist", userauth.isBan, homeController.productList);


router.get('/search-products',homeController.searchProducts)

router.get("/signup", userauth.isLogin, authController.loadSignUp);
router.post("/signup", authController.signUp);
router.get("/signin", userauth.isLogin, authController.loadSignIn);
router.post("/signin", authController.signIn);
router.get("/logout", authController.Logout);

router.post("/authsignup", authController.authsignup);
router.post("/authsignin", authController.authsignin);

router.get("/otp", authController.loadOtp);
router.post("/otp", authController.verifyOTP);
router.post("/resend", authController.resendOtp);

router.get("/forgot", passwordController.loadForgot);
router.post("/forgot", passwordController.forgot);
router.get("/reset", passwordController.loadReset);
router.post("/reset", passwordController.reset);


router.get("/cart", userauth.checkSession, userauth.isBan, cartController.loadCart);
router.post("/cart", userauth.checkSession, cartController.Carts);
router.get("/cartdelete", cartController.cartDelete);


router.get("/buynow/:id", orderController.buyNow);
router.get("/checkout", userauth.checkSession, userauth.isBan, orderController.loadCheckout);
router.post("/checkout", orderController.CheckOut);
router.get("/orderview/:orderId/:productId", orderController.OrderView);
router.get("/update-order-status", orderController.cancellOrder);
router.get("/ordersuccess", orderController.orderSuccess);


router.get("/profile/:id", userauth.checkSession, userauth.isBan, profileController.loadProfile);
router.post("/address", profileController.addAddress);
router.post("/remove-address/:id", profileController.removeAdrress);
router.post("/edit-address", profileController.editAddress);
router.post("/update-profile", multer.upload.single("image"), profileController.editProfile);


router.get("/wishlist", userauth.checkSession, userauth.isBan, wishlistController.loadWhishlist);


router.get("/banpage", homeController.banPage);


router.get("*", (req, res) => res.status(404).render("user/404"));

module.exports = router;