const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
  productname: {
    type: String,
    required: true,
    trim: true, 
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  brand: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'], 
  },
  offer: {
    type: String,
    default: '0%',
  },
  stock: {
    type: Number,
    required: true,
    min: [0, 'Stock cannot be negative'],
  },
  warranty: {
    type: String,
    required: true,
    trim: true,
  },
  color: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: false,
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be greater than 5'],
    default: 0,
  },
  image: {
    type: [String], 
    required: false, 
  },
}, {
  timestamps: true, 
});


 

module.exports = mongoose.model('Product', productSchema);
