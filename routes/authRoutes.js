import express from 'express';
import { signup, verifyEmail, login, requestPasswordReset, resetPassword, logout } from "../controller/authController.js";
import { authMiddleware } from '../middleware/authMiddleware.js';
import { registerGarage } from '../controller/managerController.js';

const router = express.Router();

router.post("/signup", signup);
router.get("/verify", verifyEmail);
router.post('/login', login);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/logout', logout);
router.post('/register-garage', authMiddleware, registerGarage);    

export default router;