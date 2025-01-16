const mongoose = require("mongoose");

const carOwnerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  coinBalance: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  resetToken: { type: String },
  resetTokenExpiration: { type: Date },
  
});

const CarOwner = mongoose.model("CarOwner", carOwnerSchema);
module.exports = CarOwner;
