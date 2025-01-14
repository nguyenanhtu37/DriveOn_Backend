const mongoose = require("mongoose");

const carOwner = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: Number },
    photo: { type: String },
    role: {
        type: String,
        enum: ["parent", "admin"],
        default: "parent",
    },
    address: {type: String},
    age: {type: Number},
    isVerified: { type: Boolean, default: false },

});


const User = mongoose.models.User || mongoose.model('User', userSchema);


module.exports = User;
