import mongoose from "mongoose";

const serviceDetailSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
    garage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Garage",
    },
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    images: [
      {
        type: String,
      },
    ],
    price: {
      type: Number,
      set: (value) => value * 1000,
    },
    duration: {
      type: Number,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const ServiceDetail = mongoose.model("ServiceDetail", serviceDetailSchema);
export default ServiceDetail;
