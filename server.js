import express from "express";
import connectDB from "./src/config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

// Import Routes
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

// Allowed origins
const allowedOrigins = [
  "https://driveon-deploy.vercel.app",
  "http://localhost:5173",
];

// Middleware
app.use(express.json());
app.use(bodyParser.json());

// CORS Config
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

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

// Test Route
app.get("/", (req, res) => {
  res.send("Hello, DriveOn Backend!");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running at: http://localhost:${PORT}`);
});
