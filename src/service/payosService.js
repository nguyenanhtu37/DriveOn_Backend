import dotenv from "dotenv";
import payos from "../utils/payos.js";

dotenv.config();

export const createPaymentLink = async (garageId, orderCode, amount, description) => {
    if (amount > 10000000000) {
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

export const webHook = (webhookBody) => {
    try {
        console.log("Webhook received:", webhookBody);

        // Bỏ qua xác minh chữ ký nếu không cần thiết
        const webhookData = webhookBody.data;

        if (webhookData.status === "SUCCESS") {
            console.log(`Payment successful for orderCode: ${webhookData.orderCode}`);
            return {
                success: true,
                message: "Payment successful",
                data: webhookData,
            };
        } else if (webhookData.status === "FAILED") {
            console.error(`Payment failed for orderCode: ${webhookData.orderCode}`);
            return {
                success: false,
                message: "Payment failed",
                data: webhookData,
            };
        } else {
            console.warn(`Unhandled payment status: ${webhookData.status}`);
            return {
                success: false,
                message: "Unhandled payment status",
                data: webhookData,
            };
        }
    } catch (error) {
        console.error("Error processing webhook:", error);
        return {
            success: false,
            message: "Failed to process webhook",
            error: error.message,
        };
    }
};