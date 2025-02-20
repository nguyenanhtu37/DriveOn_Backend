import express from "express";
import { addService } from "../controller/serviceController.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/add", adminMiddleware, addService); // Add new service

export default router;