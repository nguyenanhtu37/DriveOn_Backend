import mongoose from "mongoose";
import { string } from "zod";

const emergencySchema = new mongoose.Schema(
  {
    sessionId: {
      type: String, // Changed from lowercase 'string' to 'String'
      required: true,
    },
    garage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Garage",
    },
    isAccepted: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
    },
    images: [
      {
        type: String,
      },
    ],
    address: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
  },
  {
    timestamps: true,
  }
);

const Emergency = mongoose.model("Emergency", emergencySchema);
export default Emergency;
