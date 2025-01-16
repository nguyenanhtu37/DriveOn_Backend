const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = 5000;

const garageRoutes = require("./routes/garageRoutes");

app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/garage", garageRoutes);

app.get("/", (req, res) => {
  res.send("Hello, DriveOn Backend!");
});

app.listen(PORT, () => {
  console.log(`Server is running at: http://localhost:${PORT}`);
});
