import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    garage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Garage",
    },
    transactionResponseId: {
        type: String,
    },
    amount: {
        type: Number,
    },
    currency: {
        type: String,
    },
    paymentMethod: {
        type: String,
    },
    customerName: {
        type: String,
    },
    customerEmail: {
        type: String,
    },
    signature: {
        type: String,
    },
    timestamp: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    paymentStatus: {
        type: String,
    }
});

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;