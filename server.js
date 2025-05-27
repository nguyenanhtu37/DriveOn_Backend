import express from "express";
import connectDB from "./src/config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import cron from "node-cron";
import downgradeExpiredGarages from "./src/config/cron.js";
import { sendMaintenanceReminderEmails } from "./src/service/appointmentService.js";

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
import payosRoutes from "./src/routes/payosRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import fcmRoutes from "./src/routes/fcmRoutes.js";
import subscriptionRoutes from "./src/routes/subscriptionRoutes.js";
import transactionRoutes from "./src/routes/transactionRoutes.js";
import cozeRoutes from "./src/routes/cozeRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

app.use((req, res, next) => {
  console.log("Client IP:", req.ip);
  next();
});

// Middleware
// app.use(express.json());
// app.use(bodyParser.json());
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(express.static("public"));
// app.use(express.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: true }));

// CORS Config
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Set Security Headers
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

// Connect to Database
connectDB();
// khoi dong cron job:
downgradeExpiredGarages().then(() => {
  console.log("Initial downgrade run completed. Cron job scheduled.");
});

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
app.use("/api/payos", payosRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/api/coze", cozeRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Hello, DriveOn Backend!");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running at: http://localhost:${PORT}`);
});

// Cron job chạy hàng ngày lúc 08:00
cron.schedule("0 8 * * *", async () => {
  console.log("Running daily maintenance reminder job at 08:00 AM");
  await sendMaintenanceReminderEmails();
});
