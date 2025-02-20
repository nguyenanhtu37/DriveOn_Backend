import express from "express";
import { addServiceDetail, getServiceDetailsByGarage, updateServiceDetail } from "../controller/serviceDetailController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", authMiddleware, addServiceDetail); // Add new service detail by garage
router.get("/garage/:garageId", authMiddleware, getServiceDetailsByGarage); // Get service details by garage ID
router.put("/:id", authMiddleware, updateServiceDetail); // Update service detail by ID

export default router;