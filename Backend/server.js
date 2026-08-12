const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const teamPerformanceRoutes = require("./routes/teamPerformanceRoutes");
const leadRoutes = require("./routes/leadRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const customerRoutes = require("./routes/customerRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const path = require("path");


const app = express();

// Database Connection
connectDB();

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
    "http://localhost:5173",
    "https://mhaveer.vercel.app"
  ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/team-performance", teamPerformanceRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/meetings", meetingRoutes);
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("🚀 Backend is Running Successfully...");
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Handle unhandled promise rejections gracefully
process.on("unhandledRejection", (err) => {
  console.log("❌ Unhandled Rejection! Shutting down gracefully...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions gracefully
process.on("uncaughtException", (err) => {
  console.log("❌ Uncaught Exception! Shutting down gracefully...");
  console.log(err.name, err.message);
  process.exit(1);
});