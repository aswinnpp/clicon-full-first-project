
const mongoose = require("mongoose");
const formattedDate = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});


const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],  
    default: "user",         
  },
  createdAt: {
    type: String,
    default: formattedDate,
  },
  name:{
    type: String,
    require:true

  },
  phone:{
    type:Number,
    require:true
  },
  isBan:{
    type:Boolean,
    require:true,
    default:false
  }

});

module.exports = mongoose.model("User", userSchema);

