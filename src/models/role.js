import { Schema, model } from "mongoose";

const roleSchema = new Schema({
  roleName: {
    type: String,
    required: true,
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

const Role = model("Role", roleSchema);
export default Role;
