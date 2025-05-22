import jwt from "jsonwebtoken";
import User from "../models/user.js";

const adminMiddleware = async (req, res, next) => {
  try {
    // Kiểm tra token
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res
        .status(401)
        .json({ message: "Không có token, từ chối truy cập!" });
    }
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    // Tìm user và kiểm tra role
    const user = await User.findById(decoded.id).populate("roles");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }
    // Kiểm tra role admin
    console.log("User roles: ", user.roles);
    if (!user.roles.some((role) => role.roleName === "admin")) {
      return res
        .status(403)
        .json({ message: "Không có quyền truy cập. Chỉ admin mới được phép!" });
    }
    // Lưu thông tin user vào request
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token không hợp lệ!" });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token đã hết hạn!" });
    }
    res.status(500).json({ message: "Lỗi server!", error: err.message });
    console.log("Error: ", err);
  }
};

export { adminMiddleware };
