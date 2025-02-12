import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import managerRoutes from "./routes/managerRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";

import cors from "cors";
import bodyParser from "body-parser";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(
  cors({
    origin: "http://localhost:5173", // Địa chỉ frontend
    methods: ["GET", "POST", "PUT", "DELETE"], // Các phương thức cho phép
    credentials: true, // Nếu cần gửi cookie
  })
);

// connect to db
connectDB();

// routes
app.use("/api/auth", authRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/vehicles", vehicleRoutes);

app.get("/", (req, res) => {
  res.send("Hello, DriveOn Backend!");
});

app.listen(PORT, () => {
  console.log(`Server is running at: http://localhost:${PORT}`);
});
