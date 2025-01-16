import { verify } from 'jsonwebtoken';
import { findOne } from '../models/garageManager';

const authenticateGarageManager = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header is missing' });
    }
    const token = authHeader.replace('Bearer ', '');
    try {
        const decoded = verify(token, process.env.JWT_SECRET_KEY);
        const user = await findOne({ _id: decoded._id, 'tokens.token': token });
        if (!user) {
            return res.status(401).json({ message: 'Not authorized to access this resource' });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

export default { authenticateGarageManager };