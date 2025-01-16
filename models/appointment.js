const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  garage: { type: mongoose.Schema.Types.ObjectId, ref: "Garage" },
  listService: [{ type: mongoose.Schema.Types.ObjectId, ref: "ServiceDetail" }],
  appointmentDate: { type: Date, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Appointment = mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;
