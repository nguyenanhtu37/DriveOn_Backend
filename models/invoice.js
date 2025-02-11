const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment"
  },
  totalServiceFee: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
});

const Task = mongoose.model("Task", invoiceSchema);
module.exports = Task;
