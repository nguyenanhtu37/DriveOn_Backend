const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  garage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Garage",
    required: true,
  },
  service: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceDetail",
    required: true,
  }],
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected", "Completed", "Cancelled"],
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  paymentStatus: {
    type: Boolean,
    default: false,
  }
});

const Appointment = mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;
