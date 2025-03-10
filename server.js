import express from "express";
import connectDB from "./src/config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import garageRoutes from "./src/routes/garageRoutes.js";
import roleRoutes from "./src/routes/roleRoutes.js";
import vehicleRoutes from "./src/routes/vehicleRoutes.js";
import brandRoutes from "./src/routes/brandRoutes.js";
import favoriteRoutes from "./src/routes/favoriteRoutes.js";
import feedbackRoutes from "./src/routes/feedbackRoutes.js";
import serviceRoutes from "./src/routes/serviceRoutes.js";
import serviceDetailRoutes from "./src/routes/serviceDetailRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "https://driveon-deploy.vercel.app",
  "http://localhost:5173"
];

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.removeHeader("Cross-Origin-Opener-Policy");
  res.removeHeader("Cross-Origin-Embedder-Policy");
  res.setHeader("Content-Security-Policy", "frame-ancestors 'self' https://accounts.google.com");
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

// Test Route
app.get("/", (req, res) => {
  res.send("Hello, DriveOn Backend!");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running at: http://localhost:${PORT}`);
});