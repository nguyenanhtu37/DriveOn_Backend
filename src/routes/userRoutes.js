import express from "express";
import { changePassword, viewPersonalProfile, updatePersonalProfile } from "../controller/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/change-password", authMiddleware, changePassword); // change password
router.get("/view-personal-profile", authMiddleware, viewPersonalProfile); // view personal profile
router.put("/update-personal-profile", authMiddleware, updatePersonalProfile); // update personal profile

export default router;
