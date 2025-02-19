const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    reportType: {
        type: String,
        required: true
    },
    reportDescription: {
        type: String,
        required: true
    },
    reportStatus: {
        type: String,
        enum: ["pending", "resolved"],
        default: "pending"
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

const Report = mongoose.model("Report", reportSchema);
module.exports = Report;
