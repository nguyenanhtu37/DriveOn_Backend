import express from "express";
import { addService, getAllServices } from "../controller/serviceController.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/add", adminMiddleware, addService); // Add new service
router.get("/", getAllServices); // Get all services


export default router;