import express from "express";
import {
  createEmergency,
  getEmergencies,
  getEmergencyById,
  updateEmergency,
  deleteEmergency,
  requestEmergencyHelp,
  acceptEmergency,
} from "../controller/emergencyController.js";

const router = express.Router();

// Create new emergency
router.post("/create", createEmergency);

// Get all emergencies
router.get("/", getEmergencies);

// Get emergency by ID
router.get("/:emergencyId", getEmergencyById);

// Update emergency
router.put("/:emergencyId", updateEmergency);

// Delete emergency
router.delete("/:emergencyId", deleteEmergency);

// Request emergency help (sends request to active garages)
router.get("/request-help", requestEmergencyHelp);

// Accept emergency request (for garages)
router.post("/accept", acceptEmergency);

// Get emergencies for a specific garage

export default router;
