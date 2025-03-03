import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied!" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    console.log("decoded: ", decoded);
    // Kiểm tra xem user có roles hợp lệ không
    if (!decoded.roles || !Array.isArray(decoded.roles)) {
      return res.status(403).json({ message: "Access denied. Invalid roles structure." });
    }
    // Lọc bỏ các giá trị null và undefined trong mảng roles
    const validRoles = decoded.roles.filter(role => role !== null && role !== undefined);
    if (validRoles.length === 0) {
      return res.status(403).json({ message: "Access denied. No valid roles found." });
    }
    // Kiểm tra xem user có role được phép không (carowner hoặc manager)
    const allowedRoles = ["carowner", "manager"];
    const hasValidRole = validRoles.some(role => allowedRoles.includes(role));
    if (!hasValidRole) {
      return res.status(403).json({ message: "Access denied. Insufficient permissions." });
    }
    // Cập nhật roles trong decoded token với chỉ các roles hợp lệ
    decoded.roles = validRoles;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: "Token is not valid!" });
    console.log("Error: ", err);
  }
};

export { authMiddleware };