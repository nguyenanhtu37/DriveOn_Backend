import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    carBrand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
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
    carImages: {
      type: [String],
      required: true,
    },
    carOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;
