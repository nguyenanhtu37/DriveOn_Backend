import dotenv from "dotenv";
import Transaction from "../models/transaction.js";
import Garage from "../models/garage.js";
import Subscription from '../models/subscription.js';
import dayjs from "dayjs";
import payos from '../config/payos.js';

dotenv.config();

export const createPaymentLink = async (
    garageId,
    orderCode,
    subscriptionId,
    calculatedAmount,
    description,
    month,
    idempotencyKey = null
) => {
    if (!garageId || typeof garageId !== "string") {
        throw new Error("Invalid garageId. Garage ID is required and must be a string.");
    }

    if (typeof calculatedAmount !== "number" || calculatedAmount <= 0) {
        throw new Error("Invalid amount. Amount must be a positive number.");
    }

    if (calculatedAmount > 10_000_000_000) {
        throw new Error(`Amount must not exceed 10 billion. Provided amount: ${calculatedAmount}`);
    }

    const FRONTEND_URL = process.env.FRONTEND_URL;
    if (!FRONTEND_URL) {
        throw new Error("FRONTEND_URL is not defined in environment variables.");
    }

    const transaction = new Transaction({
        orderCode,
        garageId,
        subscriptionId,
        amount: calculatedAmount,
        description,
        month,
        status: "PENDING",
        idempotencyKey
    });

    const body = {
        orderCode,
        amount: calculatedAmount,
        description,
        returnUrl: `${FRONTEND_URL}/payment-success`,
        cancelUrl: `${FRONTEND_URL}/payment-cancel`
    };

    try {
        const paymentLinkResponse = await payos.createPaymentLink(body);

        if (!paymentLinkResponse || !paymentLinkResponse.checkoutUrl) {
            console.error("PayOS response missing checkoutUrl:", paymentLinkResponse);
            throw new Error("Invalid response from PayOS. Missing checkout URL.");
        }

        transaction.checkoutUrl = paymentLinkResponse.checkoutUrl;
        await transaction.save();

        return {
            checkoutUrl: paymentLinkResponse.checkoutUrl,
            transactionId: transaction._id
        };
    } catch (error) {
        console.error("PayOS payment link error:", error.response?.data || error.message);
        throw new Error("Failed to create payment link. Please try again later.");
    }
};

export const processPayment = async ({ orderCode, garageId, amount, month }) => {
    try {
        const transaction = await Transaction.findOne({ orderCode, status: "PENDING" });
        if (!transaction) {
            throw new Error("Transaction not found or already processed");
        }

        const [garage, subscription] = await Promise.all([
            Garage.findById(garageId),
            Subscription.findById(transaction.subscriptionId)
        ]);

        if (!garage) {
            throw new Error("Garage not found");
        }

        if (!subscription) {
            throw new Error("Subscription not found");
        }

        if (transaction.amount !== amount) {
            throw new Error("Amount mismatch");
        }

        await Transaction.findOneAndUpdate(
            { orderCode, status: "PENDING" },
            { status: "PAID", paidAt: new Date() }
        );

        const currentExpiration = garage.expiredTime ? dayjs(garage.expiredTime) : dayjs();
        const newExpiration = currentExpiration.add(month, "month");

        garage.subscription = subscription._id;
        garage.expiredTime = newExpiration.toDate();

        await garage.save();

        return { success: true, message: "Payment processed successfully" };
    } catch (error) {
        console.error("Error processing payment:", error);
        throw new Error("Failed to process payment: " + error.message);
    }
};