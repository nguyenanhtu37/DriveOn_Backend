const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  coinBalance: { type: Number, default: 0 },
  vehicles: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },

  ],
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
