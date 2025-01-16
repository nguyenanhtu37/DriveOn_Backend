const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  roleName: {
    enum: ["carowner", "manager", "staff", "admin"]
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

const Role = mongoose.model("Role", roleSchema);
module.exports = Role;
