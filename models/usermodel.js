
const mongoose = require("mongoose");

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
    enum: ["user", "admin"],  // Only 'user' and 'admin' roles are allowed
    default: "user",         // Default role is 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  name:{
    type: String,
    require:true

  },
  phone:{
    type:Number,
    require:true
  }
});

module.exports = mongoose.model("User", userSchema);

