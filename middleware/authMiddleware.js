const jwt = require('jsonwebtoken');
const GarageManager = require('../models/garageManager');

const authenticateGarageOwner = async (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await GarageManager.findOne({ _id: decoded._id, 'tokens.token': token });

    if (!user) {
        throw new Error('Not authorized to access this resource');
    }

    req.user = user;
    next();
};

module.exports = { authenticateGarageOwner };