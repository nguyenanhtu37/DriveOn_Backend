import express from 'express';
import { signup, verifyEmail, login, requestPasswordReset, resetPassword, logout } from "../controller/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.get("/verify", verifyEmail);
router.post('/login', login);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/logout', logout);

export default router;