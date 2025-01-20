import jwt from "jsonwebtoken";
const { verify } = jwt;

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization").replace("Bearer ", "");
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
  console.log("User information:", req.user);
  if (!req.user.roles || !Array.isArray(req.user.roles)) {
    return res.status(403).json({ message: "Access denied, admin only!" });
  }

  const roles = req.user.roles;
  if (roles.includes("admin")) {
    next();
  } else {
    res.status(403).json({ message: "Access denied, admin only!" });
  }
};

//
const managerMiddleware = (req, res, next) => {
  if (!req.user.roles || !Array.isArray(req.user.roles)) {
    return res.status(403).json({ message: "Access denied, manager only!" });
  }

  const roles = req.user.roles;
  if (roles.includes("manager")) {
    next();
  } else {
    res.status(403).json({ message: "Access denied, manager only!" });
  }
};

<<<<<<< HEAD
export {authMiddleware, adminMiddleware, managerMiddleware};
=======
export { authMiddleware, adminMiddleware, managerMiddleware };
>>>>>>> 889a6ac27c0ec17914663090716014cca0110ae7
