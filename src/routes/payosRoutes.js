import express from "express";
import {createPaymentLink, webHook} from '../controller/payosController.js';

const router = express.Router();

router.post('/create-payment-link', createPaymentLink);
router.post('/webhook', webHook);

export default router;
