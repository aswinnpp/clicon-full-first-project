const express = require("express");
const router = express.Router();
const adminController = require("../controller/admincontroller")
const adminauth = require("../middleware/adminauth");



router.get('/login',adminauth.isLogin,adminController.loadLogin)
router.post("/login", adminController.login);


router.get('/dashboard',adminauth.checkSession,adminController.loadDashboard)
router.get('/usermanage',adminauth.checkSession,adminController.loadUserManage)
router.get('/userupdate',adminauth.checkSession,adminController.loadUserUpdate)
router.get('/productmanage',adminauth.checkSession,adminController.loadProductManage)


module.exports=router;