const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  coinBalance: {
    type: Number,
    default: 0
  },
  vehicles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle"
  }],
  roleName: [{
    type: String,
    enum: ["carowner", "manager", "staff", "admin"],
    default : "carowner",
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  bankAccount: {
    type: String,
    unique: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
