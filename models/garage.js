// const mongoose = require("mongoose");

// const garageSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   address: { type: String, required: true },
//   phone: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   manager: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "GarageManager",
//     required: true,
//   },
//   staff: [{ type: mongoose.Schema.Types.ObjectId, ref: "GarageStaff" }],
//   services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },
// });

// const Garage = mongoose.model("Garage", garageSchema);
// module.exports = Garage;

const mongoose = require('mongoose');

const garageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
    // Các trường khác tùy theo yêu cầu của bạn
});

const Garage = mongoose.model('Garage', garageSchema);

module.exports = Garage;