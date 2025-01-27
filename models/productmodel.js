const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
  productname: {
    type: String,
    trim: true, 
  },
  category: {
    type:String,
  
    trim: true,
  },
  ram: {
    type: [String], 
    default:'nill'
  },
  storage: {
    type: [String],
    default:'nill' 
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'Category',
    
  },
  // brand: {
  //   type: String,
  //   trim: true,
  // },
  price: {
    type: String,
    min: [0, 'Price cannot be negative'], 
  },
  stock: {
    type: Number,
    min: [0, 'Stock cannot be negative'],
  },
  warranty: {
    type: String,
    trim: true,
  },
  color: {
    type: [String],
    trim: true,
  },
  description: {
    type: String,
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be greater than 5'],
    default: 0,
  },
  image: {
    type:[String]
  },
  isDeleted: {
    type: Boolean,
    default: false, 
  },
  offer:{
    type:String
  }
}, {
  timestamps: true, 
});


 

module.exports = mongoose.model('Product', productSchema);
