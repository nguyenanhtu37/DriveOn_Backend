const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authenticate = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided. Please authenticate.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decoded._id).populate('roles');

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
    const userRoles = req.user.roles.map(role => role.roleName);
    if (!roles.some(role => userRoles.includes(role))) {
        return res.status(403).json({ success: false, message: 'Forbidden. You do not have access to this resource.' });
    }
    next();
};

module.exports = {
    authenticate,
    restrict
};