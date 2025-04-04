import express from 'express';
import payos from '../utils/payos.js';
import * as payosService from '../service/payosService.js';

const router = express.Router();

export const createPaymentLink = async (req, res) => {
    const { garageId, amount, description } = req.body;
    try {
        const orderCode = Number(String(Date.now()).slice(-6));
        const paymentLink = await payosService.createPaymentLink(garageId, orderCode, amount, description);
        res.status(201).json({ message: "Payment link created!", paymentLink: paymentLink });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const webHook = async (req, res) => {
    try {
        console.log("Webhook headers:", req.headers);
        console.log("Webhook body:", req.body);

        if (!req.body || Object.keys(req.body).length === 0) {
            console.error("Webhook body is empty");
            return res.status(400).json({ error: "Webhook body is empty" });
        }

        const webhookResponse = await payosService.webHook(req.body);

        if (webhookResponse.success) {
            res.status(200).json({ message: webhookResponse.message, data: webhookResponse.data });
        } else {
            res.status(400).json({ message: webhookResponse.message, data: webhookResponse.data });
        }
    } catch (error) {
        console.error("Error in webhook controller:", error);
        res.status(500).json({ error: "Failed to process webhook" });
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