const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: 'admin' },  // Admin chỉ có quyền này

});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
