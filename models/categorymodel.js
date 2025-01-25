const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    
  },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    description:{
      type:String,


    }
   ,
    isDeleted: {
      type: Boolean,
      default: false, 
    },
}, {
  timestamps: true, 
});


module.exports = mongoose.model('Category', categorySchema);

