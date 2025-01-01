const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController")
const adminauth = require("../middleware/adminauth");
const multer = require('multer')
const path = require('path')

// MULTER DISK STORAGE
function generateStorag(){

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, `./uploads`);
        },
        filename: function (req, file, cb) {
          const fileExtention = path.extname(file.originalname)
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const filename = uniqueSuffix + fileExtention
          cb(null,filename );
        }
    });

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const fileFilter = function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (imageExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files with extensions .jpg, .jpeg, .png, .gif are allowed!'), false);
        }
    };
    
    return multer({
      storage: storage,
      fileFilter: fileFilter,
      limits: {
          fileSize: 5 * 1024 * 1024, // 5MB limit
      },
  });
   
} 

const upload = generateStorag()

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

router.post('/productcreate',upload.array('image'),adminauth.checkSession,adminController.Productcreate)

router.get('/productview',adminauth.checkSession,adminController.loadProductview)



router.get('/categorymanage',adminauth.checkSession,adminController.loadCategoryManage)


module.exports=router;