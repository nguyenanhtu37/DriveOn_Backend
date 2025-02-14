import express from "express";
import { changePassword, viewPersonalProfile } from "../controller/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/change-password", authMiddleware, changePassword); 
router.get("/view-personal-profile", authMiddleware, viewPersonalProfile);

export default router;
