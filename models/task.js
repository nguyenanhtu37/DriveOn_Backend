const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment"
  },
  garage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Garage"
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
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

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
