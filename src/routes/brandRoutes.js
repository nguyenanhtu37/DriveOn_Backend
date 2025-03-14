import express from "express";
import { addBrand, getBrands } from "../controller/brandController.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { authMiddleware } from "../middleware/authMiddleware.js"
const router = express.Router();

router.post('/add', adminMiddleware, addBrand); // add new brand 
router.get('/get', adminMiddleware, getBrands); // get all brands
router.get("/", authMiddleware, getBrands);
export default router;
