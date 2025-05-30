import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      //=username cua staff
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    // vehicles: [{
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Vehicle"
    // }],
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    googleId: {
      type: String,
    },
    avatar: {
      type: String,
    },
    emailVerified: {
      type: Boolean,
    },
    locale: {
      type: String,
    },
    givenName: {
      type: String,
    },
    familyName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
