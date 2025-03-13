import express from "express";
import { createAppointment,getAcceptedAppointments,getAppointmentsByUser,getAppointmentById,denyAppointment,completeAppointment,getAppointmentsByGarage,confirmAppointment } from "../controller/appointmentController.js";
import {authorizeRoles} from "../middleware/authorizeRoles.js";

const router = express.Router();

router.post("/service-detail/:serviceDetailId/create", authorizeRoles([ "staff","carowner"]), createAppointment); // Create appointment
router.get("/view-list-user-appointment", authorizeRoles(["carowner"]), getAppointmentsByUser); // Get appointments by user
router.get("/:appointmentId",authorizeRoles([ "manager","staff","carowner"]), getAppointmentById); // Get specific appointment by ID
router.get("/garage/:garageId", authorizeRoles(["manager", "staff"]), getAppointmentsByGarage); // Get appointments by garage
router.put("/:appointmentId/confirm", authorizeRoles([ "staff"]), confirmAppointment); // Confirm appointment
router.put("/:appointmentId/deny", authorizeRoles([ "staff"]), denyAppointment); // Deny appointment
router.put("/:appointmentId/complete", authorizeRoles([ "staff"]), completeAppointment); // Complete appointment
router.get("/:garageId/accepted", authorizeRoles(["manager", "staff"]), getAcceptedAppointments); // Get accepted appointments by garageIdexport default router;/ Get accepted appointments
export default router;