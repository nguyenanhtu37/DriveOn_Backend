import express from "express";
import connectDB from "./src/config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import PayOS from '@payos/node';

// Import Routes
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import garageRoutes from "./src/routes/garageRoutes.js";
import roleRoutes from "./src/routes/roleRoutes.js";
import vehicleRoutes from "./src/routes/vehicleRoutes.js";
import brandRoutes from "./src/routes/brandRoutes.js";
import favoriteRoutes from "./src/routes/favoriteRoutes.js";
import feedbackRoutes from "./src/routes/feedbackRoutes.js";
import appointmentRoutes from "./src/routes/appointmentRoutes.js";
import serviceRoutes from "./src/routes/serviceRoutes.js";
import serviceDetailRoutes from "./src/routes/serviceDetailRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const payos = new PayOS(process.env.PAYOS_CLIENT_ID, process.env.PAYOS_API_KEY, process.env.PAYOS_CHECKSUM_KEY);
const APP_DOMAIN = process.env.FRONTEND_URL;

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static('public'));

// CORS Config
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Set Security Headers
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

// Connect to Database
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/garage", garageRoutes);
app.use("/api/user", userRoutes);
app.use("/api/vehicle", vehicleRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/favorite", favoriteRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/service", serviceRoutes);
app.use("/api/service-detail", serviceDetailRoutes);
app.use("/api/appointment", appointmentRoutes);

// Create payment link
app.post('/create-payment-link', async (req, res) => {
  try {
    const { amount, description } = req.body;
    const orderCode = Date.now();

    if (!amount || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['amount', 'description']
      });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount'
      });
    }

    const order = {
      amount: Math.round(amount),
      description: description.substring(0, 200),
      orderCode,
      returnUrl: `${APP_DOMAIN}/payment/success`,
      cancelUrl: `${APP_DOMAIN}/payment/cancel`,
    };

    const paymentLink = await payos.createPaymentLink(order);

    res.status(200).json({
      success: true,
      checkoutUrl: paymentLink.checkoutUrl,
      orderCode
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      error: 'Failed to create payment link',
      message: error.message
    });
  }
});

// Handle payment success
app.get('/payment/success', async (req, res) => {
  try {
    const { orderCode, status } = req.query;

    if (status === 'PAID') {
      const paymentInfo = await payos.getPaymentLinkInformation(orderCode);
      if (paymentInfo.status === 'PAID') {
        console.log(`Payment ${orderCode} successful, amount: ${paymentInfo.amount}`);
        return res.redirect(`${APP_DOMAIN}/success-page`);
      }
    }
    res.redirect(`${APP_DOMAIN}/error-page`);
  } catch (error) {
    console.error('Payment success error:', error);
    res.redirect(`${APP_DOMAIN}/error-page`);
  }
});

// Handle payment cancel
app.get('/payment/cancel', async (req, res) => {
  try {
    const { orderCode } = req.query;
    console.log(`Payment ${orderCode} cancelled`);
    res.redirect(`${APP_DOMAIN}/cancel-page`);
  } catch (error) {
    console.error('Payment cancel error:', error);
    res.redirect(`${APP_DOMAIN}/error-page`);
  }
});

// Test Route
app.get("/", (req, res) => {
  res.send("Hello, DriveOn Backend!");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running at: http://localhost:${PORT}`);
});