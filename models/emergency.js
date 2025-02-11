const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceDetail",
        required: true,
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
});

const Emegency = mongoose.model("Emegency", emergencySchema);
module.exports = Emegency;