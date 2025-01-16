const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const { authenticateGarageManager } = require("../middleware/authMiddleware");

router.post("/register/carOwner", authController.registerCarOwner);
router.post("/register/garageManager", authController.registerGarageManager);
router.post(
  "/register/garageStaff",
  authenticateGarageManager,
  authController.registerGarageStaff
);
router.post("/login", authController.login);
router.get("/verify-email", authController.verifyEmail);

module.exports = router;
