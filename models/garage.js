const mongoose = require("mongoose");
const User = require("./user");

// const garageSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     address: { type: String, required: true },
//     phone: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     manager: { type: mongoose.Schema.Types.ObjectId, ref: 'GarageManager', required: true },
//     staff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GarageStaff' }],
//     services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now }
// });
// Update
const garageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  description: { type: String, required: true },
  phone_1: { type: String, required: true },
  phone_2: { type: String, required: true },
  operatingHours: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  rating: { type: Number, default: 0 },
  user: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const Garage = mongoose.model("Garage", garageSchema);
module.exports = Garage;
