const express = require("express");
const router = express.Router();
const authController = require("../controller/adminController/authController");
const userController = require("../controller/adminController/userController");
const productController = require("../controller/adminController/productController");
const categoryController = require("../controller/adminController/categoryController");
const orderController = require("../controller/adminController/orderController");
const couponController = require("../controller/adminController/couponController");
const returnController = require("../controller/adminController/returnsController");
const multer = require("../utils/multter");
const adminauth = require("../middleware/adminauth");

const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

router.get("/login", adminauth.isLogin, authController.loadLogin);
router.post("/login", authController.login);
router.get("/adminlogout", authController.adminLogout);
router.get("/dashboard", adminauth.checkSession, authController.loadSales);
  router.get("/dashboard-graph", adminauth.checkSession, authController.loadDashboardGraph);

router.get(
  "/usermanage",
  adminauth.checkSession,
  userController.loadUserManage
);
router.get(
  "/userupdate/:id",
  adminauth.checkSession,
  userController.loadUserUpdate
);
router.post("/userupdate", userController.updateUser);
router.post("/banuser/:id", userController.banUser);

router.get(
  "/productmanage",
  adminauth.checkSession,
  productController.loadProductManage
);
router.get(
  "/productupdate/:id",
  adminauth.checkSession,
  productController.loadProductUpdate
);
router.post(
  "/productupdate",
  multer.uploadMultiple,
  productController.ProductUpdate
);
router.get(
  "/productcreate",
  adminauth.checkSession,
  productController.loadProductcreate
);
router.post(
  "/productcreate",
  multer.upload.array("images", 4),
  productController.ProductCreate
);
router.get(
  "/productview/:id",
  adminauth.checkSession,
  productController.loadProductview
);
router.post("/productdelete/:id", productController.productDelete);

router.get(
  "/categorymanage",
  adminauth.checkSession,
  categoryController.loadCategoryManage
);
router.get(
  "/categorycreate",
  adminauth.checkSession,
  categoryController.loadCategoryCreate
);
router.post("/categorycreate", categoryController.categoryCreate);
router.get(
  "/categoryupdate/:id",
  adminauth.checkSession,
  categoryController.loadCategoryUpdate
);
router.post("/categoryupdate", categoryController.CategoryUpdate);
router.post("/categorydelete/:id", categoryController.categoryDelete);

router.get(
  "/ordermanage",
  adminauth.checkSession,
  orderController.loadOrdermanage
);
router.post("/update-status/:id", orderController.OrderManage);
router.get(
  "/orderview/:orderId/:productId",
  adminauth.checkSession,
  orderController.orderView
);
router.post(
  "/update-product-status/:orderId/:productId",
  orderController.statusUpdate
);

router.get(
  "/couponcreate",
  adminauth.checkSession,
  couponController.loadCouponCreate
);
router.get("/couponedit", adminauth.checkSession, couponController.couponEdit);
router.get(
  "/couponmanage",
  adminauth.checkSession,
  couponController.loadCouponmanage
);

router.delete("/coupondelete", couponController.deleteCoupon);
router.post(
  "/couponedit",
  adminauth.checkSession,
  couponController.updateCoupon
);

router.post("/couponcreate", couponController.couponCreate);

router.get("/returns", adminauth.checkSession, returnController.loadReturns);

router.post("/productApprove", returnController.productApprove);
router.post("/productRejected", returnController.productRejected);


router.get("/api/new-returns", returnController.notification )

// 404 Handler
router.get("*", (req, res) => {
  res.status(404).render("admin/404");
});

module.exports = router;
