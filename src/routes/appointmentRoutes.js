import express from "express";
import { createAppointment,getAppointmentsByUser } from "../controller/appointmentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/service-detail/:serviceDetailId/create", authMiddleware, createAppointment); // Create appointment
// router.get("/user", authMiddleware, getAppointmentsByUser); // Get appointments by user

export default router;