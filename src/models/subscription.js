import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  pricePerMonth: {
    type: Number, // vnd
    required: true,
  },
}, { timestamps: true });

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;