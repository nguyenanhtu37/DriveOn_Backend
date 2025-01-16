const mongoose = require('mongoose');

const garageManagerSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    garageName: { type: String, required: true },
    phone: { type: String, required: true },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
    verificationToken: { type: String },
    isVerified: { type: Boolean, default: false },
});

const GarageManager = mongoose.model('GarageManager', garageManagerSchema);
module.exports = GarageManager;