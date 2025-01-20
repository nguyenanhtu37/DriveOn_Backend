import mongoose from "mongoose";

const garageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  workingHours: {
    type: String,
    required: true,
  },
  coinBalance: {
    type: Number,
    required: true,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  rating: {
    type: Number,
    default: 0,
  },
  user: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
<<<<<<< HEAD
  images: [{
    type: String
  }]
=======
  images: [
    {
      type: String,
    },
  ],
>>>>>>> 889a6ac27c0ec17914663090716014cca0110ae7
});

const Garage = mongoose.model("Garage", garageSchema);
export default Garage;
