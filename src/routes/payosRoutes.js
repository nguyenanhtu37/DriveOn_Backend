import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createPaymentLink, webHook } from "../controller/payosController.js";

const router = express.Router();

router.post("/create-payment-link", authMiddleware, createPaymentLink);
router.post("/webhook", webHook);

export default router;
