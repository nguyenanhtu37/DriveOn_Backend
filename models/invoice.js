const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appoiment" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  total: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
