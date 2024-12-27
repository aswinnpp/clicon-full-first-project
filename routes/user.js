const express = require("express");
const router = express.Router();
const userController = require("../controller/usercontroller")
const userauth = require("../middleware/userauth");




router.get('/home',userauth.isLogin,userController.loadHome)











module.exports=router;