import jwt from 'jsonwebtoken';
const { verify } = jwt;

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied!" });
    }
    try {
        const decoded = verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ message: "Token is not valid" });
    }
};

const adminMiddleware = (req, res, next) => {
  console.log('User information:', req.user); 
  if (!req.user.roles || !Array.isArray(req.user.roles)) {
    return res.status(403).json({ message: "Access denied, admin only!" });
  }

  const roles = req.user.roles;
  if (roles.includes('admin')) {
    next();
  } else {
    res.status(403).json({ message: "Access denied, admin only!" });
  }
};

export {authMiddleware, adminMiddleware};