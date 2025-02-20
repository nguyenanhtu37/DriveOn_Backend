import express from "express";
import { addServiceDetail } from "../controller/serviceDetailController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", authMiddleware, addServiceDetail); // Add new service detail by garage

export default router;