const mongoose = require("mongoose");
const User = require("./user");

const feedbackSchema = new mongoose.Schema({
  rating: {
    type: Number,
    default: 0
  },
  text: {
    type: String,
  },
  garage: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Garage"
  }],
});

const Feedback = mongoose.model("Feedback", feedbackSchema);
module.exports = Feedback;
