import express from "express";
import { createAppointment,getAppointmentsByUser,getAppointmentById,denyAppointment,completeAppointment,getAppointmentsByGarage,confirmAppointment } from "../controller/appointmentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
    garageMiddleware
} from "../middleware/garageMiddleware.js";

const router = express.Router();

router.post("/service-detail/:serviceDetailId/create", authMiddleware, createAppointment); // Create appointment
router.get("/view-list-user-appointment", authMiddleware, getAppointmentsByUser); // Get appointments by user
router.get("/:appointmentId", authMiddleware, getAppointmentById); // Get specific appointment by ID
router.get("/garage/:garageId", authMiddleware, getAppointmentsByGarage); // Get appointments by garage
router.put("/:appointmentId/confirm", garageMiddleware, confirmAppointment); // Confirm appointment
router.put("/:appointmentId/deny", garageMiddleware, denyAppointment); // Deny appointment
router.put("/:appointmentId/complete", garageMiddleware, completeAppointment); // Complete appointment

export default router;