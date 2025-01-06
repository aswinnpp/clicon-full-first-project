
const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
   
  },
  role: {
    type: String,
    enum: ["user", "admin"],  
    default: "user",         
  },
  name:{
    type: String,
    require:true

  },
  phone:{
    type:Number,
    default:""
  },
  isBan:{
    type:Boolean,
    require:true,
    default:false
  },
  authuser:{
    type:Boolean,
    default:false
  }
}, {
  timestamps: true, 
});



module.exports = mongoose.model("User", userSchema);

