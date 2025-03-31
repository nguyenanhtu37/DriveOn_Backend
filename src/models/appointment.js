import mongoose from "mongoose";

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
  service: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceDetail",
      required: true,
    },
  ],
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  start: {
    type: String,
    required: true,
  },
  end: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected", "Completed", "Cancelled"],
    default: "Pending",
  },
  tag: {
    type: String,
    enum: ["Normal", "Emergency"],
    default: "Normal",
    required: true,
  },
  note: {
    type: String,
    default: "",
  }
}, { timestamps: true });

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;
