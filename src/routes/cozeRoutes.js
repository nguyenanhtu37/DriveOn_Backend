import express from "express";
import { getServices, searchServices } from "../controller/cozeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/services", authMiddleware, getServices);
// search service
router.get("/search", searchServices);

export default router;
