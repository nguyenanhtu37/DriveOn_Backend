import express from 'express';
import { signup, verifyEmail } from "../controller/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.get("/verify", verifyEmail);

export default router;