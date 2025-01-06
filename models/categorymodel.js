const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique:true 
  },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    count: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false, 
    },
}, {
  timestamps: true, 
});


module.exports = mongoose.model('Category', categorySchema);

