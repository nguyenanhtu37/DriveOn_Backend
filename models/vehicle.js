const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
    carBrand: {
        type: String,
        required: true,
    },
    carModel: {
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
})

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
module.exports = Vehicle;
