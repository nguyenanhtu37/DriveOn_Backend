

import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  rating: {
    type: Number,
    default: 0
  },
  garage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Garage"
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  text: {
    type: String,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service"
  },
});

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
