import express from "express";
import { createAppointment,getAppointmentsByUser,getAppointmentById } from "../controller/appointmentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/service-detail/:serviceDetailId/create", authMiddleware, createAppointment); // Create appointment
router.get("/view-list-user-appointment", authMiddleware, getAppointmentsByUser); // Get appointments by user
router.get("/:appointmentId", authMiddleware, getAppointmentById); // Get specific appointment by ID

export default router;