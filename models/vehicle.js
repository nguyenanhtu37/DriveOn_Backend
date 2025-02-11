const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
    carBrand: {
        type: mongoose.Mongoose.Types.ObjectId,
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
})

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
module.exports = Vehicle;
