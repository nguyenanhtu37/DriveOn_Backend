const mongoose = require('mongoose');

const garageStaffSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    assignedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
});

const GarageStaff = mongoose.model('GarageStaff', garageStaffSchema);
module.exports = GarageStaff;
