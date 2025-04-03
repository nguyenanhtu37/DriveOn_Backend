import express from "express";
import { changePassword, viewPersonalProfile, updatePersonalProfile, viewAllUsers } from "../controller/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

// User routes
router.post("/change-password", authMiddleware, changePassword); // change password
router.get("/view-personal-profile", authMiddleware, viewPersonalProfile); // view personal profile
router.put("/update-personal-profile", authMiddleware, updatePersonalProfile); // update personal profile


// Admin routes
router.get("/view-all-users", adminMiddleware, viewAllUsers); // Admin xem toàn bộ danh sách user

export default router;
