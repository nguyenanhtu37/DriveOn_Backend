const mongoose = require('mongoose');

const carOwnerSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    coinBalance: { type: Number, default: 0 },
    vehicles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' }],
    verificationToken: { type: String },
    isVerified: { type: Boolean, default: false },
});

const CarOwner = mongoose.model('CarOwner', carOwnerSchema);
module.exports = CarOwner;