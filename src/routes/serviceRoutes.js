import express from "express";
import { addService, getAllServices, updateService, deleteService } from "../controller/serviceController.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/add", adminMiddleware, addService); // Add new system service
router.get("/", getAllServices); // Get all system services
router.put("/:id", adminMiddleware, updateService); // Update system  service by ID
router.delete("/:id", adminMiddleware, deleteService); // Delete service by ID

export default router;