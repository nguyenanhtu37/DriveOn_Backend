import express from "express";
import {
  signup,
  verifyEmail,
  login,
  requestPasswordReset,
  resetPassword,
  logout,
  googleLogin,
} from "../controller/authController.js";

const router = express.Router();

router.post("/signup", signup); // signup new account
router.get("/verify", verifyEmail); // verify email when signup new account
router.post("/login", login); // login manual (email + password) 
router.post("/request-password-reset", requestPasswordReset); // request send password reset link
router.post("/reset-password", resetPassword); // reset new password 
router.post("/logout", logout); // logout 
router.post("/google", googleLogin); // google login

export default router;
