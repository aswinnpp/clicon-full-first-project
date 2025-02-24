const express = require("express");
const router = express.Router();
const userauth = require("../middleware/userauth");
const multer = require('../utils/multter'); 
const Cart = require("../models/cartpagemodel")
const userSchema = require("../models/usermodel")
const Product = require ("../models/productmodel")
require("dotenv").config();

  
   


const authController = require("../controller/userController/authController");
const homeController = require("../controller/userController/homeController");
const cartController = require("../controller/userController/cartController");
const orderController = require("../controller/userController/orderController");
const profileController = require("../controller/userController/profileController");
const passwordController = require("../controller/userController/passwordController");
const wishlistController = require("../controller/userController/wishlistController");
const WalletController = require("../controller/userController/walletController");






 

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
router.get("/orderview/:orderId/:productId",userauth.checkSession, userauth.isBan, orderController.OrderView);
router.get("/update-order-status",userauth.checkSession, userauth.isBan, orderController.cancellOrder);
router.get("/ordersuccess", userauth.checkSession, userauth.isBan,orderController.orderSuccess);


router.get("/profile/:id", userauth.checkSession, userauth.isBan, profileController.loadProfile);
router.post("/address", profileController.addAddress);
router.post("/remove-address/:id", profileController.removeAdrress);
router.post("/edit-address", profileController.editAddress);
router.post("/update-profile", multer.upload.single("image"), profileController.editProfile);


router.get("/wishlist", userauth.checkSession, userauth.isBan, wishlistController.loadWhishlist);
router.post("/wishlist",userauth.checkSession,wishlistController.wishlist)
router.post("/wishlist/remove",wishlistController.removeProduct)

router.post("/create-order", orderController.razorpay)
router.get("/wallet",userauth.checkSession, userauth.isBan, WalletController.loadWallet)

router.post ("/returns",orderController.productReturns )

router.get("/banpage", homeController.banPage);
// In your Express route file
router.get('/getCartSummary', async (req, res) => {
    try {
        // Get user's cart items and calculate totals

        const user = await userSchema.findOne({email:req.session.details.email})
        const items = await Cart.find({ userId:user._id })
            .populate('items.productId');

        let originalTotal = 0;
        let totalDiscount = 0;
        let finalTotal = 0;
        let totalItems = 0;
        items.forEach(cart => {
            cart.items.forEach(item => {
                if (item.productId && item.productId.price) {
                    const originalPrice = parseFloat(item.productId.price.replace(/,/g, '')) || 0;
                    const discountMatch = item.productId.offer ? item.productId.offer.match(/\d+/) : null;
                    const discountPercentage = discountMatch ? parseFloat(discountMatch[0]) : 0;

                    // Calculate per item
                    const singleItemDiscountedPrice = originalPrice - (originalPrice * discountPercentage / 100);
                    const singleItemOriginalTotal = originalPrice;
                    const singleItemDiscountAmount = originalPrice - singleItemDiscountedPrice;

                    // Multiply by quantity for total
                    const itemTotalOriginal = singleItemOriginalTotal * item.quantity;
                    const itemTotalDiscounted = singleItemDiscountedPrice * item.quantity;
                    const discountAmount = singleItemDiscountAmount * item.quantity;
                }

                originalTotal += itemTotalOriginal;
                totalDiscount += discountAmount;
                finalTotal += itemTotalDiscounted;
                totalItems += item.quantity;
            });
        });

        console.log(originalTotal,totalDiscount,finalTotal,totalItems)

        res.json({
            originalTotal,
        });
    } catch (error) {
        console.error('Error calculating cart summary:', error);
        res.status(500).json({ error: 'Error calculating cart summary' });
    }
}); 

router.get("*", (req, res) => res.status(404).render("user/404"));
router.post("/updatecart",cartController.updateCart)
module.exports = router;