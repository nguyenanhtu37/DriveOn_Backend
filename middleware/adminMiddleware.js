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

export {adminMiddleware};