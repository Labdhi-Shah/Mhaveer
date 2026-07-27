const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
dotenv.config();

const app = express();

// Database Connection
connectDB();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://mhaveer.vercel.app"
  ],
  credentials: true,
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("🚀 Backend is Running Successfully...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});