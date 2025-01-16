const jwt = require('jsonwebtoken');
const GarageManager = require('../models/garageManager');

const authenticateGarageManager = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header is missing' });
    }

    const token = authHeader.replace('Bearer ', '');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await GarageManager.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) {
            return res.status(401).json({ message: 'Not authorized to access this resource' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = { authenticateGarageManager };