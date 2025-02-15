const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountValue: { type: Number, required: true }, 
  minOrderAmount: { type: Number, default: 0 },
  users: { type: [mongoose.Schema.Types.ObjectId], ref: "User" },
  usageLimit: { type: Number, default: 1 }, 
  startDate: { type: Date, required: true }, 
  expiryDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
});

couponSchema.pre("validate", function (next) {
  if (this.expiryDate < new Date()) {
    this.isActive = false;
  }
  next();
});

module.exports = mongoose.model("Coupon", couponSchema);
