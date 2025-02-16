const mongoose = require('mongoose');

const orderDetailsSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative'],
  },

  paymentMethod: {
    type: String,
    enum: ["cod", "Wallet", "razorpay", 'Cash on Delivery'],
    required: true
}, 
  billingAddress: {
    name: { type: String, required: true },
    country: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postcode: { type: String, required: true },
    phone: { type: String, required: true },
  }, coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    quantity: {
      type: Number,
    
      min: [1, 'Quantity must be at least 1'],
    }, 
     color:{
      type:String,
      require:true
      
    },
    
    shippingDetails: {
      origin: { type: String, required: true, default: "India" }, 
      estimatedArrival: { type: Date, default: new Date('2025-02-15') }, 
      actualArrival: { type: Date, default: null },
      status: { type: String, enum: ['Pending', 'Shipped','Cancelled','Processing', 'Delivered'], default: 'Pending' },
    }
    
  }],
  shippingMethod: {
    type: String,
    enum: ['Standard', 'Express'],
    
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true, 
});

module.exports = mongoose.model('OrderDetails', orderDetailsSchema);
