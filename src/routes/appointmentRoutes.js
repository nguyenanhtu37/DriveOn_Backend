import express from "express";
import { createAppointment } from "../controller/appointmentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/service-detail/:serviceDetailId/create", authMiddleware, createAppointment); // Create appointment

export default router;