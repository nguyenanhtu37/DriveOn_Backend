const mongoose = require("mongoose");

const appoitmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  garage: { type: mongoose.Schema.Types.ObjectId, ref: "Garage" },
  listSevice: [{ type: mongoose.Schema.Types.ObjectId, ref: "ServiceDetail" }],
  appoimentDate: { type: Date, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Appoiment = mongoose.model("Appoiment", appoitmentSchema);
module.exports = Appoiment;
