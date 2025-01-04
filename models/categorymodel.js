const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique:true

   
  },
    productId:[ {
      type: Schema.Types.ObjectId,
      ref: 'Product', 
      required: false,
    }],status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    count: {
      type: Number,
      default: 0,
    },
}, {
  timestamps: true, 
});


module.exports = mongoose.model('Category', categorySchema);

