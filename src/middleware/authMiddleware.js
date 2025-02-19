import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied!" });
    }

    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });

    next();
  } catch (err) {
    res.status(400).json({ message: "Token is not valid!" });
    console.log("Error: ", err);
  }
};

export { authMiddleware };