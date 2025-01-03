const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, '/upload'); 
  },
  filename: function (req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`); 
  }
});


const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(
        new Error('Please upload only jpg, jpeg, png'),
        false
      );
    }
    cb(undefined, true);
  },
  }); 



const fileFilter = (req, file, cb) => {

const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); 
} else {
    cb(new Error('Please upload only JPG, JPEG, or PNG files.'), false); 
}
};

const uploaded = multer({ storage, fileFilter });



  module.exports={upload,uploaded}