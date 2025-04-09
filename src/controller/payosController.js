import express from 'express';
import * as payosService from '../service/payosService.js';
import Subscription from "../models/subscription.js";
import Garage from '../models/garage.js';
import Transaction from '../models/transaction.js';

const router = express.Router();

export const createPaymentLink = async (req, res) => {
    const { garageId, subscriptionCode, month } = req.body;
    try {
        if (!garageId || !subscriptionCode || !month) {
            return res.status(400).json({ message: "Missing required fields!" });
        }

        const garage = await Garage.findById(garageId);
        if (!garage) return res.status(404).json({ message: "Garage not found" });

        const subscription = await Subscription.findOne({ code: subscriptionCode });
        if (!subscription) return res.status(404).json({ message: "Subscription not found" });

        const amount = subscription.pricePerMonth * month;
        const orderCode = Number(String(Date.now()).slice(-6));
        const garageNameShort = garage.name.length > 15 ? garage.name.slice(0, 15) + "…" : garage.name;
        const description = `Upgrade ${garageNameShort} (${month}m)`;

        const paymentLink = await payosService.createPaymentLink(garageId, orderCode, amount, description);

        res.status(201).json({
            message: "Payment link created!",
            paymentLink: {
                checkoutUrl: paymentLink.checkoutUrl,
                amount,
                orderCode,
                description,
                subscription: subscription.name,
                garage: garage.name
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const webHook = async (req, res) => {
    try {
        console.log("Webhook received:", req.body);

        // Nếu body rỗng, chỉ xác minh webhook
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(200).json({ message: "Webhook validated successfully" });
        }

        const result = await payosService.webHook(req.body);

        if (result.success) {
            return res.status(200).json({ message: result.message, data: result.data });
        } else {
            return res.status(400).json({ message: result.message, data: result.data });
        }
    } catch (error) {
        console.error("Webhook controller error:", error);
        return res.status(500).json({ error: "Failed to process webhook" });
    }
};

// router.get("/:orderId", async function (req, res) {
//     try {
//         const order = await payos.getPaymentLinkInfomation(req.params.orderId);
//         if (!order) {
//             return res.json({
//                 error: -1,
//                 message: "failed",
//                 data: null,
//             });
//         }
//         return res.json({
//             error: 0,
//             message: "ok",
//             data: order,
//         });
//     } catch (error) {
//         console.log(error);
//         return res.json({
//             error: -1,
//             message: "failed",
//             data: null,
//         });
//     }
// });

// router.put("/:orderId", async function (req, res) {
//     try {
//         const { orderId } = req.params;
//         const body = req.body;
//         const order = await payos.cancelPaymentLink(orderId, body.cancellationReason);
//         if (!order) {
//             return res.json({
//                 error: -1,
//                 message: "failed",
//                 data: null,
//             });
//         }
//         return res.json({
//             error: 0,
//             message: "ok",
//             data: order,
//         });
//     } catch (error) {
//         console.error(error);
//         return res.json({
//             error: -1,
//             message: "failed",
//             data: null,
//         });
//     }
// });

// router.post("/confirm-webhook", async (req, res) => {
//     const { webhookUrl } = req.body;
//     try {
//         await payos.confirmWebhook(webhookUrl);
//         return res.json({
//             error: 0,
//             message: "ok",
//             data: null,
//         });
//     } catch (error) {
//         console.error(error);
//         return res.json({
//             error: -1,
//             message: "failed",
//             data: null,
//         });
//     }
// });

export default router;