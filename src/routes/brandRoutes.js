import express from "express";
import { addBrand } from "../controller/brandController.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post('/add', adminMiddleware, addBrand); // add new brand 

export default router;
