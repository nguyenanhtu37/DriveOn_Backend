import express from "express";
import { addServiceDetail, getServiceDetailsByGarage, updateServiceDetail, deleteServiceDetail, getServiceDetailById, searchServices, getEmergency } from "../controller/serviceDetailController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// search service
router.get('/search', searchServices);

// emergency assistance
// router.get('/emergency', getEmergency);

router.post("/add", authMiddleware, addServiceDetail); // Add new service detail by garage
router.get("/garage/:garageId", getServiceDetailsByGarage); // Get service details by garage ID
router.put("/:id", authMiddleware, updateServiceDetail); // Update service detail by ID
router.delete("/:id", authMiddleware, deleteServiceDetail); // Delete service detail by ID

router.get("/:id", getServiceDetailById); // Get service detail by ID

export default router;