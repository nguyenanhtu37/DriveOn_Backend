import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import garageRoutes from "./routes/garageRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import cors from "cors";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(express.json());
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

app.get("/", (req, res) => {
  res.send("Hello, DriveOn Backend!");
});

app.listen(PORT, () => {
  console.log(`Server is running at: http://localhost:${PORT}`);
});
