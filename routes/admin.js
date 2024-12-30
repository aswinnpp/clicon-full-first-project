const express = require("express");
const router = express.Router();
const adminController = require("../controller/admincontroller")
const adminauth = require("../middleware/adminauth");



router.get('/login',adminauth.isLogin,adminController.loadLogin)
router.post("/login", adminController.login);



router.get('/dashboard',adminauth.checkSession,adminController.loadDashboard)



router.get('/usermanage',adminauth.checkSession,adminController.loadUserManage)

router.get('/userupdate/:id',adminauth.checkSession,adminController.loadUserUpdate)

router.post('/userupdate',adminController.updateUser)

router.post("/banuser",adminController.banUser)



router.get('/productmanage',adminauth.checkSession,adminController.loadProductManage)

router.get('/productupdate',adminauth.checkSession,adminController.loadProductUpdate)

router.get('/productcreate',adminauth.checkSession,adminController.loadProductcreate)

router.get('/productview',adminauth.checkSession,adminController.loadProductview)



router.get('/categorymanage',adminauth.checkSession,adminController.loadCategoryManage)


module.exports=router;