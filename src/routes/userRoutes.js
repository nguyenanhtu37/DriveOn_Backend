import express from "express";
import { changePassword, viewPersonalProfile, updatePersonalProfile } from "../controller/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/change-password", authMiddleware, changePassword); 
router.get("/view-personal-profile", authMiddleware, viewPersonalProfile);
router.put("/update-personal-profile", authMiddleware, updatePersonalProfile);

export default router;
