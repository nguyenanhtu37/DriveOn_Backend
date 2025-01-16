const mongoose = require("mongoose");

const serviceDetailSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
  garage: { type: mongoose.Schema.Types.ObjectId, ref: "Garage" },
  name: { type: String },
  description: { type: String },
  images: [{ type: String }],
  price: { type: Number },
  averageTime: { type: String },
  rating: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ServiceDetail = mongoose.model("ServiceDetail", serviceDetailSchema);
module.exports = ServiceDetail;
