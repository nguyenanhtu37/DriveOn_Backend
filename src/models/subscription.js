import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    garageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Garage',
        required: true
    },
    expiredAt: {
        type: Date,
        required: true
    },
    tag: {
        type: String,
        enum: ["pro", "normal"],
        default: "normal",
        required: true,
    },
})

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
