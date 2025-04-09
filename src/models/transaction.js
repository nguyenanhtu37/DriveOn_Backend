import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    garageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Garage', required: true
    },
    subscriptionCode: {
        type: String,
        required: true
    },
    month: {
        type: Number,
        required: true
    },
    orderCode: {
        type: Number,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED'],
        default: 'PENDING'
    },
    paidAt: {
        type: Date
    },
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);
