import dotenv from "dotenv";
import payos from "../utils/payos.js";

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

export const webHook = (webhookBody) => {
    try {
        console.log("Webhook body received:", webhookBody);

        // Kiểm tra dữ liệu webhook
        if (!webhookBody || !webhookBody.data) {
            throw new Error("Invalid webhook data: Missing 'data' field");
        }

        const webhookData = webhookBody.data;

        // Kiểm tra nếu trường 'code' không tồn tại
        if (!webhookData.code) {
            console.warn("Webhook data does not contain 'code' field");
            return {
                success: false,
                message: "Missing 'code' field in webhook data",
                data: webhookData,
            };
        }

        // Xử lý trạng thái thanh toán dựa trên 'code'
        switch (webhookData.code) {
            case "00": // Thành công
                console.log(`Payment successful for orderCode: ${webhookData.orderCode}`);
                return {
                    success: true,
                    message: "Payment successful",
                    data: webhookData,
                };

            case "01": // Thất bại
                console.error(`Payment failed for orderCode: ${webhookData.orderCode}`);
                return {
                    success: false,
                    message: "Payment failed",
                    data: webhookData,
                };

            default: // Trạng thái không xác định
                console.warn(`Unhandled payment code: ${webhookData.code}`);
                return {
                    success: false,
                    message: `Unhandled payment code: ${webhookData.code}`,
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