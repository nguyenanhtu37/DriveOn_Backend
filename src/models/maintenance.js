const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema({
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceDetail",
        required: true,
    },
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
        required: true,
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    nextMaintenance: { //thac mac thi hoi Anh Tu
        type: Date,
        required: true,
    },
}); 

const Maintenance = mongoose.model("Maintenance", maintenanceSchema);
module.exports = Maintenance;
