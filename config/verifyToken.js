const jwt = require('jsonwebtoken');
const CarOwner = require('../models/carOwner');
const GarageManager = require('../models/garageManager');
const GarageStaff = require('../models/garageStaff');
const Admin = require('../models/admin');

const authenticate = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided. Please authenticate.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        let user = await CarOwner.findById(decoded._id) ||
            await GarageManager.findById(decoded._id) ||
            await GarageStaff.findById(decoded._id) ||
            await Admin.findById(decoded._id);

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found. Please authenticate.' });
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token. Please authenticate.' });
    }
};

const restrict = roles => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden. You do not have access to this resource.' });
    }
    next();
};

module.exports = {
    authenticate,
    restrict
};