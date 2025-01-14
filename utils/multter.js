const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'C:/Users/lenovo/OneDrive/Documents/clicon/uploads'); 
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`); 
    }
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);  // Allow the file to be uploaded
  } else {
      cb(new Error('Please upload only JPG, JPEG, or PNG files.'), false);  // Reject other file types
  }
};
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return cb(new Error('Please upload only jpg, jpeg, png'), false);
      }
      cb(undefined, true);
    },
});

const uploaded = multer({ storage, fileFilter });

// Use `multer.fields()` to handle multiple files with different field names
const uploadMultiple = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
    { name: 'image0', maxCount: 1 },
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 }
]);

module.exports = { upload, uploaded, uploadMultiple };
