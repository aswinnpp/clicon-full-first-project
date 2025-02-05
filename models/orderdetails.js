const mongoose = require('mongoose');

const orderDetailsSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a Customer model
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
    enum: ['Credit Card', 'Debit Card', 'PayPal', 'Cash on Delivery'],
    // required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending',
  },
 
  billingAddress: {
    name: { type: String, required: true },
    country: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postcode: { type: String, required: true },
    phone: { type: String, required: true },
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
