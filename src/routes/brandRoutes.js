import express from "express";
import { addBrand, getBrands, updateBrand, deleteBrand } from "../controller/brandController.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post('/add', adminMiddleware, addBrand); // add new brand 
router.get('/get', getBrands); // get all brands
router.put('/update', adminMiddleware, updateBrand); // update brand
router.delete('/delete', adminMiddleware, deleteBrand); // delete brand

export default router;