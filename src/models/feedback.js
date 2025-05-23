import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      default: 0,
    },
    garage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Garage",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    serviceDetail: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceDetail",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
