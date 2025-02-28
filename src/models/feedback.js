const mongoose = require("mongoose");

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
  }
});

const Feedback = mongoose.model("Feedback", feedbackSchema);
module.exports = Feedback;
