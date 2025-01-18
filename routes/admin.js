const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const adminauth = require("../middleware/adminauth");

const multer = require("../utils/multter");




router.get("/adminlogout", adminController.adminLogout)


router.get("/login",  adminController.loadLogin);

router.post("/login", adminController.login);

router.get("/dashboard", adminauth.checkSession, adminController.loadDashboard);




router.get("/usermanage",adminauth.checkSession,adminController.loadUserManage);

router.get("/userupdate/:id",adminauth.checkSession,adminController.loadUserUpdate);

router.post("/userupdate", adminController.updateUser);



router.post("/banuser/:id", adminController.banUser);



router.post('/categorydelete/:id',adminController.categoryDelete)

router.post('/productdelete/:id',adminController.productDelete)



router.get("/productmanage",adminauth.checkSession,adminController.loadProductManage);

router.get( "/productupdate/:id",adminauth.checkSession,adminController.loadProductUpdate);

router.post("/productupdate",multer.uploadMultiple,adminController.productUpdate);

router.get( "/productcreate",adminauth.checkSession,adminController.loadProductcreate);

router.post("/productcreate",multer.upload.array('images', 4),adminController.Productcreate);

router.get("/productview/:id",adminauth.checkSession,adminController.loadProductview);





router.get("/categorymanage",adminauth.checkSession,adminController.loadCategoryManage);

router.get('/categorycreate',adminauth.checkSession,adminController.loadCategoryCreate)

router.post('/categorycreate',adminController.categoryCreate)

router.get('/categoryupdate/:id',adminauth.checkSession,adminController.loadCategoryUpdate)

router.post('/categoryupdate',adminController.CategoryUpdate)


router.get("/ordermanage" ,adminController.loadOrdermanage)

router.get("/couponmanage" ,adminController.loadCouponmanage)





module.exports = router;
