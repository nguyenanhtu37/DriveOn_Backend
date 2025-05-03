import express from "express";
import {
  createAppointment,
  getAcceptedAppointments,
  updateAppointment,
  cancelAppointment,
  getAppointmentsByUser,
  getAppointmentById,
  denyAppointment,
  completeAppointment,
  getAppointmentsByGarage,
  confirmAppointment,
  getNextMaintenanceList,
  createAppointmentByStaff,
  isCalledAppointment,
} from "../controller/appointmentController.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const router = express.Router();

router.post(
  "/create",
  authorizeRoles(["staff", "carowner"]),
  createAppointment
); // Create appointment

router.get(
  "/view-list-user-appointment",
  authorizeRoles(["carowner"]),
  getAppointmentsByUser
); // Get appointments by user

router.get(
  "/:appointmentId",
  authorizeRoles(["manager", "staff", "carowner"]),
  getAppointmentById
); // Get specific appointment by ID

router.get(
  "/garage/:garageId",
  authorizeRoles(["manager", "staff"]),
  getAppointmentsByGarage
); // Get appointments by garage

router.put(
  "/:appointmentId/confirm",
  authorizeRoles(["manager", "staff"]),
  confirmAppointment
); // Confirm appointment

router.put(
  "/:appointmentId/deny",
  authorizeRoles(["manager", "staff"]),
  denyAppointment
); // Deny appointment

router.put(
  "/:appointmentId/complete",
  authorizeRoles(["staff", "manager"]),
  completeAppointment
); // Complete appointment

router.get(
  "/:garageId/accepted",
  authorizeRoles(["manager", "staff"]),
  getAcceptedAppointments
); // Get accepted appointments by garage

router.put(
  "/:appointmentId/cancel",
  authorizeRoles(["carowner"]),
  cancelAppointment
); // Cancel appointment

router.put(
  "/:appointmentId/update",
  authorizeRoles(["carowner"]),
  updateAppointment
); // Update appointment
router.get(
  "/garage/:garageId/next-maintenance",
  authorizeRoles(["manager", "staff"]),
  getNextMaintenanceList
); // Get next maintenance list
router.post(
  "/create-by-staff",
  authorizeRoles(["staff", "manager"]),
  createAppointmentByStaff
); // Create appointment by staff or manager

router.put(
  "/isCalled/:appointmentId",
  authorizeRoles(["manager", "staff"]),
  isCalledAppointment
); // Mark appointment as called);

export default router;
