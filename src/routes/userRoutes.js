import express from "express";
import {
  changePassword,
  viewPersonalProfile,
  updatePersonalProfile,
  viewAllUsers,
  viewUserDetails,
  enableUserAccount,
  disableUserAccount,
} from "../controller/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

// User routes
router.post("/change-password", authMiddleware, changePassword); // change password
router.get("/view-personal-profile", authMiddleware, viewPersonalProfile); // view personal profile
router.put("/update-personal-profile", authMiddleware, updatePersonalProfile); // update personal profile

// Admin routes
router.get("/view-all-users", adminMiddleware, viewAllUsers); // Admin xem toàn bộ danh sách user
router.get("/view-user/:id", adminMiddleware, viewUserDetails); // Admin xem chi tiết 1 user
// router.put("/update-user-status/:id", adminMiddleware, updateUserStatus); // Admin enable/disable user
router.put("/enable-user/:id", adminMiddleware, enableUserAccount); // admin enable user
router.put("/disable-user/:id", adminMiddleware, disableUserAccount); // admin để disable user

export default router;
