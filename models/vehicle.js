import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  carBrand: {
    type: String, // sửa lại sau nếu làm qua admin, carbrand sau này sẽ là 1 object id
    required: true,
  },
  carName: {
    type: String,
    required: true,
  },
  carYear: {
    type: String,
    required: true,
  },
  carColor: {
    type: String,
    required: true,
  },
  carPlate: {
    type: String,
    required: true,
  },
  carOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  maintenanceHistory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Maintenance",
    },
  ],
  appointment: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
  ],
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;