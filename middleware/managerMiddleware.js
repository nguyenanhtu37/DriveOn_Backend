const checkManagerRole = (req, res, next) => {
    console.log("User information:", req.user);
    if (!req.user.roles || !Array.isArray(req.user.roles)) {
        return res.status(403).json({ message: "Access denied. Manager role required." });
    }

    const roles = req.user.roles;
    if (roles.includes("manager")) {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Manager role required." });
    }
};

export { checkManagerRole };