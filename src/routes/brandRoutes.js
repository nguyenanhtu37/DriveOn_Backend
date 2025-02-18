import express from "express";
import { addBrand } from "../controller/brandController.js";

const router = express.Router();

router.post('/add', addBrand);

export default router;
