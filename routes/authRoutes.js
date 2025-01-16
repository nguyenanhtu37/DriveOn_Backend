const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");

router.post("/register", authController.registerUser);
router.post("/login", authController.login);
router.get("/verify-email", authController.verifyEmail);

module.exports = router;