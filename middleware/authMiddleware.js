import jwt from "jsonwebtoken";
const { verify } = jwt;

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization").replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied!" });
  }
  try {
    const decoded = verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }); 
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: "Token is not valid" });
    console.log("Error: ", err);
  }
};

export { authMiddleware };