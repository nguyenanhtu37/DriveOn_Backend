import express from "express";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { addRole } from "../controller/roleController.js";

const router = express.Router();

router.post("/add", adminMiddleware, addRole); // add new role

export default router;
