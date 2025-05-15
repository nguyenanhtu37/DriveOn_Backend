import * as payosService from "../service/payosService.js";
import Subscription from "../models/subscription.js";
import Transaction from "../models/transaction.js";
import Garage from "../models/garage.js";
import dayjs from "dayjs";

export const createPaymentLink = async (req, res) => {
  const { garageId, subscriptionId, idempotencyKey } = req.body;
  if (!garageId || !subscriptionId) {
    return res.status(400).json({
      message: "Missing required fields: garageId or subscriptionId.",
    });
  }
  try {
    const [garage, subscription] = await Promise.all([
      Garage.findById(garageId),
      Subscription.findById(subscriptionId),
    ]);
    if (!garage) {
      return res.status(404).json({ message: `Garage not found: ${garageId}` });
    }
    if (!subscription || subscription.isDeleted) {
      return res.status(404).json({
        message: `Subscription not found or has been deleted: ${subscriptionId}`,
      });
    }
    const amount = subscription.price;
    const month = subscription.month;
    if (!amount || typeof amount !== "number") {
      return res.status(400).json({ message: "Invalid subscription price." });
    }
    if (idempotencyKey) {
      const existingTransaction = await Transaction.findOne({
        idempotencyKey,
      }).populate("user");
      if (existingTransaction) {
        return res.status(200).json({
          message: "Transaction already exists, waiting for payment.",
          paymentLink: {
            checkoutUrl: existingTransaction.checkoutUrl,
            orderCode: existingTransaction.orderCode,
            description: existingTransaction.description,
            subscription: subscription.name,
            garage: garage.name,
            transactionId: existingTransaction._id,
            status: existingTransaction.status,
            paidAt: existingTransaction.paidAt || null,
            createdAt: existingTransaction.createdAt,
            updatedAt: existingTransaction.updatedAt,
            idempotencyKey: existingTransaction.idempotencyKey,
            user: existingTransaction.user.name,
          },
        });
      }
    }
    const orderCode = Date.now() % Number.MAX_SAFE_INTEGER;
    const fixedPart = `Upgrade  (${month}M)`;
    const maxDescriptionLength = 25;
    const maxNameLength = maxDescriptionLength - fixedPart.length;
    const shortGarageName =
      garage.name.length > maxNameLength
        ? garage.name.slice(0, maxNameLength - 1) + "…"
        : garage.name;
    const description = `Upgrade ${shortGarageName} (${month}M)`;
    const fullDescription = `Upgrade ${garage.name} to the PRO plan for ${month} month${month > 1 ? "s" : ""}`;
    const paymentLink = await payosService.createPaymentLink({
      garageId,
      orderCode,
      subscriptionId,
      calculatedAmount: amount,
      description,
      fullDescription,
      month,
      idempotencyKey,
      user: req.user.id,
    });
    return res.status(201).json({
      message: "Payment link created!",
      paymentLink: {
        checkoutUrl: paymentLink.checkoutUrl,
        amount,
        orderCode,
        description,
        subscription: subscription.name,
        garage: garage.name,
        transactionId: paymentLink.transactionId,
        status: paymentLink.status,
        paidAt: paymentLink.paidAt || null,
        createdAt: paymentLink.createdAt,
        updatedAt: paymentLink.updatedAt,
        idempotencyKey,
        user: req.user.name,
      },
    });
  } catch (error) {
    console.error("Error creating payment link:", error);
    return res
      .status(500)
      .json({ message: "Failed to create payment link", error: error.message });
  }
};

export const webHook = async (req, res) => {
  try {
    const { rawBody } = req;
    const webhookBody = JSON.parse(rawBody);

    const { code, data, idempotencyKey } = webhookBody;
    const { orderCode, amount } = data;

    if (idempotencyKey) {
      const existingTransaction = await Transaction.findOne({ idempotencyKey });
      if (existingTransaction) {
        return res.status(200).json({
          success: true,
          message: "Webhook already processed.",
        });
      }
    }

    if (code !== "00") {
      console.error(`Payment failed with code: ${code}`);
      return res.status(400).json({
        success: false,
        message: `Payment failed with error code: ${code}`,
      });
    }

    const result = await payosService.processPayment({ orderCode, amount });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error handling webhook:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getTransactionsByMonth = async (req, res) => {
  try {
    const transactions = await payosService.getTransactionsByMonth();
    res.status(200).json(transactions);
  } catch (err) {
    console.error("Error in getTransactionsByMonth:", err.message);
    res.status(500).json({ error: err.message });
  }
};
