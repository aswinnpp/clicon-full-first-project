const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderDetails', required: true }, 
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, 
    quantity:{type:Number},
    reason: { type: String, required: true }, 
    status: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Rejected'], 
        default: 'Pending' 
    }, 
    rejectionReason: { type: String, default: null }, 
    requestedAt: { type: Date, default: Date.now }, 
    reviewedAt: { type: Date }
     
});

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);
