const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
     
    required: true
 },
  items: [{
    productId:{
         type: mongoose.Schema.Types.ObjectId,
        
          required: true 
        }, 
    quantity: { 
        type: Number,
         default: 1 
        }, 
  }],
  
},{
    timestamps: true, 
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;