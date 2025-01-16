import express from 'express';
import { signup, verifyEmail, login } from "../controller/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.get("/verify", verifyEmail);
router.post('/login', login);

export default router;