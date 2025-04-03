import express from "express";
import { changePassword, viewPersonalProfile, updatePersonalProfile } from "../controller/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
// import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();
router.post("/change-password", authMiddleware, changePassword); // change password
router.get("/view-personal-profile", authMiddleware, viewPersonalProfile); // view personal profile
router.put("/update-personal-profile", authMiddleware, updatePersonalProfile); // update personal profile
// router.get("/view-users-by-roles", adminMiddleware, viewUsersByRoles);


export default router;
