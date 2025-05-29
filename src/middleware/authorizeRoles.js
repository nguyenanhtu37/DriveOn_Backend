import jwt from "jsonwebtoken";
import User from "../models/user.js";

const authorizeRoles = (allowedRoles) => async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied!" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    const user = await User.findById(decoded.id).populate("roles");
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    console.log("User Info:", {
      name: user.name,
      email: user.email,
      roles: user.roles.map((role) => role.roleName),
    });

    const hasValidRole = user.roles.some((role) =>
      allowedRoles.includes(role.roleName)
    );
    if (!hasValidRole) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient permissions." });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token!" });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired!" });
    }
    res.status(500).json({ message: "Server error!", error: err.message });
  }
};

export { authorizeRoles };
