import dotenv from "dotenv";
import Transaction from "../models/transaction.js";
import Garage from "../models/garage.js";
import User from "../models/user.js";
import Subscription from "../models/subscription.js";
import dayjs from "dayjs";
import payos from "../config/payos.js";
import transporter from "../config/mailer.js";

dotenv.config();

export const createPaymentLink = async ({
  garageId,
  orderCode,
  subscriptionId,
  calculatedAmount,
  description,
  fullDescription,
  // month,
  idempotencyKey = null,
  user,
}) => {
  if (!garageId || typeof garageId !== "string") {
    throw new Error("Invalid garageId. Must be a string.");
  }
  if (typeof calculatedAmount !== "number" || calculatedAmount <= 0) {
    throw new Error("Invalid amount. Must be a positive number.");
  }
  if (calculatedAmount > 10_000_000_000) {
    throw new Error("Amount must not exceed 10 billion.");
  }
  const FRONTEND_URL = process.env.FRONTEND_URL;
  if (!FRONTEND_URL) {
    throw new Error("FRONTEND_URL is not defined in environment variables.");
  }
  console.log("User:", user);
  const transaction = new Transaction({
    orderCode,
    garage: garageId,
    subscription: subscriptionId,
    user: user,
    description: fullDescription,
    status: "PENDING",
    idempotencyKey,
    checkoutUrl: "",
    paidAt: null,
    amount: calculatedAmount,
  });
  const payosBody = {
    orderCode,
    amount: calculatedAmount,
    description,
    returnUrl: `${FRONTEND_URL}/`,
    cancelUrl: `${FRONTEND_URL}/`,
  };
  try {
    const response = await payos.createPaymentLink(payosBody);
    if (!response?.checkoutUrl) {
      console.error("Missing checkoutUrl from PayOS response");
      throw new Error("Invalid response from PayOS.");
    }
    transaction.checkoutUrl = response.checkoutUrl;
    await transaction.save();
    return {
      checkoutUrl: response.checkoutUrl,
      transactionId: transaction._id,
    };
  } catch (error) {
    console.error(
      "PayOS payment link error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to create payment link. Please try again later.");
  }
};

export const processPayment = async ({ orderCode, amount }) => {
  console.log("orderCode: ", orderCode);
  try {
    const transaction = await Transaction.findOne({
      orderCode,
      status: "PENDING",
    });
    if (!transaction) {
      console.error(`Transaction not found for orderCode: ${orderCode}`);
      throw new Error("Transaction not found or already processed");
    }

    const { garage, subscription } = transaction;
    console.log("garageId: ", garage);

    const [garageResult, subscriptionResult] = await Promise.all([
      Garage.findById(garage),
      Subscription.findById(subscription),
    ]);

    if (!garageResult) throw new Error("Garage not found");
    if (!subscriptionResult) throw new Error("Subscription not found");

    if (transaction.amount !== amount) {
      console.error(
        `Amount mismatch for transaction ${transaction._id}. Expected: ${transaction.amount}, received: ${amount}`
      );
      throw new Error("Amount mismatch");
    }

    await Transaction.findOneAndUpdate(
      { orderCode, status: "PENDING" },
      { status: "PAID", paidAt: new Date() }
    );

    const now = dayjs();
    const currentExpiration = garage.expiredTime
      ? dayjs(garage.expiredTime)
      : now;
    const newExpiration = currentExpiration.add(
      subscriptionResult.month,
      "month"
    );

    // garageResult.subscription = subscription._id;
    garageResult.expiredTime = newExpiration.toDate();
    garageResult.tag = "pro";

    await garageResult.save();

    await sendPaymentSuccessEmailToUser(
      garageResult,
      subscriptionResult,
      amount,
      newExpiration
    );
    await sendPaymentSuccessEmailToAdmin(
      garageResult,
      subscriptionResult,
      amount,
      newExpiration
    );

    console.log(
      `Garage ${garage} upgraded to 'PRO', expires at ${newExpiration.format(
        "YYYY-MM-DD HH:mm:ss"
      )}`
    );

    return { success: true, message: "Payment processed successfully" };
  } catch (error) {
    console.error("Error processing payment:", error);
    throw new Error("Failed to process payment: " + error.message);
  }
};

export const sendPaymentSuccessEmailToUser = async (
  garage,
  subscription,
  amount,
  newExpiration
) => {
  const subject = `Your Payment for ${garage.name} has been Successful!`;

  const user = await User.findOne({
    _id: { $in: garage.user },
  }).populate("roles");

  if (user && user.email) {
    const isManager = user.roles.some((role) => role.roleName === "manager");

    if (isManager) {
      const text = `
            Dear ${user.name},

            We are pleased to inform you that your payment for upgrading your garage to 'PRO' has been successfully processed.

            Transaction Details:
            - Subscription: ${subscription.name}
            - Amount: ${amount} VND
            - New Expiration Date: ${newExpiration.format(
              "YYYY-MM-DD HH:mm:ss"
            )}

            If you have any questions, feel free to contact us.

            Best regards,
            The Garage Team
            `;

      const html = `
            <h2>Hello ${user.name},</h2>
            <p>We are pleased to inform you that your payment for upgrading your garage to <strong>'PRO'</strong> has been successfully processed.</p>
            <h3>Transaction Details:</h3>
            <ul>
                <li><strong>Subscription:</strong> ${subscription.name}</li>
                <li><strong>Amount:</strong> ${amount} VND</li>
                <li><strong>New Expiration Date:</strong> ${newExpiration.format(
                  "YYYY-MM-DD HH:mm:ss"
                )}</li>
            </ul>
            <p>If you have any questions, feel free to contact us.</p>
            <p>Best regards,<br />The Garage Team</p>
            `;

      try {
        await transporter.sendMail({
          from: process.env.MAIL_USER,
          to: user.email,
          subject,
          html,
        });
        console.log(`Payment success email sent to ${user.email}`);
      } catch (error) {
        console.error("Error sending user email:", error);
      }
    } else {
      console.error("User does not have 'manager' role.");
    }
  } else {
    console.error("User or email not found for garage:", garage._id);
  }
};

export const sendPaymentSuccessEmailToAdmin = async (
  garageResult,
  subscriptionResult,
  amount,
  newExpiration
) => {
  const subject = `Garage ${garageResult.name} has been Upgraded to 'PRO'`;

  const text = `
    Admin,

    The following garage has successfully upgraded to the 'PRO' plan:

    Garage Details:
    - Name: ${garageResult.name}
    - Address: ${garageResult.address}
    - Subscription: ${subscriptionResult.name}
    - Amount Paid: ${amount} VND
    - New Expiration Date: ${newExpiration.format("YYYY-MM-DD HH:mm:ss")}

    Please review the transaction details and confirm the upgrade.

    Best regards,
    The Garage Team
    `;

  const html = `
    <h2>Admin,</h2>
    <p>The following garage has successfully upgraded to the <strong>'PRO'</strong> plan:</p>
    <ul>
        <li><strong>Name:</strong> ${garageResult.name}</li>
        <li><strong>Address:</strong> ${garageResult.address}</li>
        <li><strong>Subscription:</strong> ${subscriptionResult.name}</li>
        <li><strong>Amount Paid:</strong> ${amount} VND</li>
        <li><strong>New Expiration Date:</strong> ${newExpiration.format(
          "YYYY-MM-DD HH:mm:ss"
        )}</li>
    </ul>
    <p>Please review the transaction details and confirm the upgrade.</p>
    <p>Best regards,<br />The Garage Team</p>
    `;

  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: adminEmail,
        subject,
        html,
      });
      console.log(`Payment success email sent to admin at ${adminEmail}`);
    } else {
      console.error("Admin email is not set.");
    }
  } catch (error) {
    console.error("Error sending admin email:", error);
  }
};

export const getTransactionsByMonth = async () => {
  try {
    const transactionsByMonth = await Transaction.aggregate([
      {
        $match: {
          status: "PAID", // Chỉ lấy các transaction đã thanh toán
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$paidAt" },
            year: { $year: "$paidAt" },
          },
          totalTransactions: { $sum: 1 },
        },
      },
      {
        $project: {
          month: "$_id.month",
          year: "$_id.year",
          totalTransactions: 1,
          _id: 0,
        },
      },
      {
        $sort: { year: 1, month: 1 },
      },
    ]);

    const currentYear = new Date().getFullYear();

    const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);

    const filledData = allMonths.map((month) => ({
      month,
      year: currentYear,
      totalTransactions: 0, // Mặc định là 0
    }));

    transactionsByMonth.forEach((item) => {
      const index = filledData.findIndex(
        (data) => data.month === item.month && data.year === item.year
      );
      if (index !== -1) {
        filledData[index].totalTransactions = item.totalTransactions;
      }
    });

    return filledData;
  } catch (err) {
    console.error("Error in getTransactionsByMonth:", err.message);
    throw new Error(err.message);
  }
};
