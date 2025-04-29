import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    orderCode: {
        type: String,
        required: true,
        unique: true,
    },
    subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscription",
        required: true,
    },
    garageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Garage",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    description: {
        type: String
    },
    month: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED"],
        default: "PENDING",
    },
    checkoutUrl: {
        type: String
    },
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true
    },
    paidAt: {
        type: Date,
    },
}, { timestamps: true });

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
