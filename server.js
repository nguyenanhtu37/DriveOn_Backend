import express from "express";
import connectDB from "./src/config/db.js";
import dotenv from "dotenv";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import garageRoutes from "./src/routes/garageRoutes.js";
import roleRoutes from "./src/routes/roleRoutes.js";
import vehicleRoutes from "./src/routes/vehicleRoutes.js";
import brandRoutes from "./src/routes/brandRoutes.js";
import serviceRoutes from "./src/routes/serviceRoutes.js";
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
app.use("/api/role", roleRoutes);
app.use("/api/garage", garageRoutes);
app.use("/api/user", userRoutes);
app.use("/api/vehicle", vehicleRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/service", serviceRoutes); 

app.get("/", (req, res) => {
  res.send("Hello, DriveOn Backend!");
});

app.listen(PORT, () => {
  console.log(`Server is running at: http://localhost:${PORT}`);
});
