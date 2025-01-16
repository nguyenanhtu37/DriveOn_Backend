const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment"
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task"
  },
  serviceFee: {
    type: Number
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
