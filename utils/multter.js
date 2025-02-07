const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadPath = path.join(__dirname, '../uploads/');
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }
//     cb(null, uploadPath); // Save to ../uploads/
//   },
//   filename: function (req, file, cb) {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

const storage = multer.memoryStorage();


const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Please upload only JPG, JPEG, or PNG files.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024, // 100MB for file uploads
    fieldSize: 10 * 1024 * 1024,},
  fileFilter,
});
;





const uploadMultiple = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024, 
      fieldSize: 10 * 1024 * 1024, }, 
}).fields([
    { name: 'image0', maxCount: 1 },
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 }
], (err, req, res, next) => {
    if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ message: "File upload error", error: err });
    }
    next();
});


module.exports = { upload,  uploadMultiple };
