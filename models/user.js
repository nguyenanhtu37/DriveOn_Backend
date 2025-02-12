import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { //=username cua staff
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
  },
  coinBalance: {
    type: Number,
    default: 0
  },
  vehicles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle"
  }],
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role"
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  bankAccount: {
    type: String,
    default: 0
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  },
  garageList: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Garage"
  }],
  googleId: {
    type: String
  },
  avatar: {
    type: String
  },
  emailVerified: {
    type: Boolean,
  },
  locale: {
    type: String
  },
  givenName: {
    type: String
  },
  familyName: {
    type: String
  }
});

const User = mongoose.model("User", userSchema);
export default User;
