const jwt = require("jsonwebtoken");
const GarageManager = require("../models/garageManager");

const authenticateGarageManager = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header is missing" });
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await GarageManager.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Not authorized to access this resource" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header is missing" });
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};

const restrict = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res
      .status(403)
      .json({
        success: false,
        message: "Forbidden. You do not have access to this resource.",
      });
  }
  next();
};

module.exports = { authenticateGarageManager, verifyToken, restrict };
