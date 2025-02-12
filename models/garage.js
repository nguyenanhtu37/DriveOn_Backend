import mongoose from "mongoose";

const garageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    working: {
      openTime: {
        type: String,
        required: true,
      },
      closeTime: {
        type: String,
        required: true,
      },
      operating_days: [
        {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          required: true,
        },
      ],
    },

    businessLicense: {
      type: String,
    },

    coinBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    user: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "enable", "disable"],
      default: "pending",
    },
    images: [
      {
        type: String,
      },
    ],
    location: {
      address: {
        type: String,
        required: true,
      },
      gps: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },
    tag: {
      type: String,
      enum: ["pro", "normal"],
      default: "normal",
      required: true,
    },
  },
  { timestamps: true }
);

const Garage = mongoose.model("Garage", garageSchema);
export default Garage;
