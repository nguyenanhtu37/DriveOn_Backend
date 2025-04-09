import dotenv from "dotenv";
import Transaction from "../models/transaction.js";
import Garage from "../models/garage.js";
import { isValidSignature } from '../utils/payos.js';
import dayjs from "dayjs";
import payos from '../config/payos.js';

dotenv.config();

export const createPaymentLink = async (garageId, orderCode, amount, description) => {
    if (!garageId) {
        throw new Error("No garage found to upgrade.");
    }

    if (amount > 10000000000) { // 10 tỏi
        throw new Error(`Amount must not be greater than ${amount}`);
    }

    const FRONTEND_URL = process.env.FRONTEND_URL;
    const body = {
        orderCode,
        amount,
        description,
        returnUrl: `${FRONTEND_URL}/`, // URL khi thanh toán thành công
        cancelUrl: `${FRONTEND_URL}/` // URL khi thanh toán bị hủy
    };

    try {
        const paymentLinkResponse = await payos.createPaymentLink(body);
        return { checkoutUrl: paymentLinkResponse.checkoutUrl }; // Trả về URL thanh toán
    } catch (error) {
        console.error("Error creating payment link:", error);
        throw new Error("Failed to create payment link");
    }
};

export const webHook = async (webhookBody) => {
    try {
        const { data, signature } = webhookBody;

        if (!data || !data.code || !data.orderCode || !signature) {
            return { success: false, message: "Invalid webhook payload" };
        }

        const secretKey = process.env.PAYOS_API_KEY;
        if (!isValidSignature(data, secretKey, signature)) {
            console.warn("Webhook signature invalid.");
            return { success: false, message: "Invalid or missing signature", data };
        }

        if (data.code !== "00") {
            return { success: false, message: "Payment not successful", data };
        }

        const transaction = await Transaction.findOne({ orderCode: data.orderCode });
        if (!transaction) return { success: false, message: "Transaction not found", data };

        if (transaction.status === "PAID") {
            return { success: true, message: "Transaction already processed", data };
        }

        const garage = await Garage.findById(transaction.garageId);
        if (!garage) return { success: false, message: "Garage not found", data };

        const now = dayjs();
        const currentExpiration = garage.subscriptionExpired;
        const baseTime = currentExpiration && dayjs(currentExpiration).isAfter(now) ? dayjs(currentExpiration) : now;
        const newExpiration = baseTime.add(transaction.month, "month");

        garage.subscription = transaction.subscriptionCode;
        garage.subscriptionExpired = newExpiration.toDate();
        await garage.save();

        transaction.status = "PAID";
        transaction.paidAt = new Date();
        await transaction.save();

        return { success: true, message: "Payment processed successfully", data };
    } catch (error) {
        console.error("payosService.webHook error:", error);
        return { success: false, message: "Webhook processing error", error: error.message };
    }
};