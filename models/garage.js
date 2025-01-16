const mongoose = require("mongoose");
const User = require("./user");

const garageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  workingHours: {
    type: String,
    required: true
  },
  coinBalance: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  rating: {
    type: Number,
    default: 0
  },
  user: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
});

const Garage = mongoose.model("Garage", garageSchema);
module.exports = Garage;
