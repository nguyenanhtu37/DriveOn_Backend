import express from "express";

import {
  approveGarageRegistrationController,
  getGarageByIdController,
  getGaragesController,
  registerGarageController,
  rejectGarageRegistrationController,
} from "../controller/garageController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/", getGaragesController);
router.get("/:id", getGarageByIdController);
router.post("/register-garage", authMiddleware, registerGarageController);
router.put(
  "/approve/:id",
  authMiddleware,
  adminMiddleware,
  approveGarageRegistrationController
);
router.put(
  "/reject/:id",
  authMiddleware,
  adminMiddleware,
  rejectGarageRegistrationController
);

export default router;
