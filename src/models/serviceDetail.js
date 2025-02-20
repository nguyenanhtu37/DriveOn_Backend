import mongoose from "mongoose";

const serviceDetailSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service"
  },
  garage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Garage"
  },
  name: {
    type: String
  },
  description: {
    type: String
  },
  images: [{
    type: String
  }],
  price: {
    type: Number
  },
  duration: {
    type: String
  },
  warranty: { //thoi gian bao hanh dich vu
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
});

const ServiceDetail = mongoose.model("ServiceDetail", serviceDetailSchema);
export default ServiceDetail;