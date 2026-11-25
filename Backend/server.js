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
const notificationRoutes = require("./routes/notificationRoutes");
const eodRoutes = require("./routes/eodRoutes");
const path = require("path");

// Security Packages
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

const app = express();

// Trust reverse proxy (Render, Cloudflare, etc.) to accurately detect client IP
app.set("trust proxy", true);

// Database Connection
connectDB();

// Middleware
// Production & Development CORS Configuration
const defaultAllowedOrigins = [
  "https://nobalfinance.com",
  "https://www.nobalfinance.com",
  "http://nobalfinance.com",
  "http://www.nobalfinance.com",
  "https://mhaveer.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://192.168.29.244:5173",
  "http://192.168.1.21:5173",
];

const isOriginAllowed = (origin) => {
  // Allow non-browser clients (curl, mobile apps, Postman, server-to-server)
  if (!origin) return true;

  // Custom environment variables
  const envOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (process.env.FRONTEND_URL) {
    envOrigins.push(process.env.FRONTEND_URL.trim());
  }

  const allExactOrigins = [...defaultAllowedOrigins, ...envOrigins];
  if (allExactOrigins.includes(origin)) return true;

  // Wildcard and pattern matching for domains/subdomains
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname;
    if (
      host === "nobalfinance.com" ||
      host === "www.nobalfinance.com" ||
      host.endsWith(".nobalfinance.com") ||
      host === "mhaveer.vercel.app" ||
      host.endsWith(".vercel.app") ||
      host.endsWith(".onrender.com") ||
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.startsWith("172.")
    ) {
      return true;
    }
  } catch (e) {
    // Malformed origin
  }

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️ [CORS REJECTED] Origin not permitted: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "x-access-token",
    ],
    exposedHeaders: ["Authorization"],
    maxAge: 86400,
  })
);


// 1. Set Security HTTP Headers (Helmet)
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// 2. Limit Requests from same API (Rate Limiting / Basic Firewall)
const limiter = rateLimit({
  max: 1000, // Allow 1000 requests from the same IP
  windowMs: 60 * 60 * 1000, // In 1 hour
  message: "Too many requests from this IP, please try again in an hour!"
});
app.use("/api", limiter);

// 3. Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" })); // Limit body size to 10kb to prevent DOS

// 4. Data sanitization against NoSQL query injection
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.query) mongoSanitize.sanitize(req.query);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.headers) mongoSanitize.sanitize(req.headers);
  next();
});

// 5. Data sanitization against XSS
const { clean } = require("xss-clean/lib/xss");
app.use((req, res, next) => {
  if (req.body) req.body = clean(req.body);
  if (req.query) {
    const cleaned = clean(req.query);
    for (const key in req.query) delete req.query[key];
    for (const key in cleaned) req.query[key] = cleaned[key];
  }
  if (req.params) {
    const cleaned = clean(req.params);
    for (const key in req.params) delete req.params[key];
    for (const key in cleaned) req.params[key] = cleaned[key];
  }
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/team-performance", teamPerformanceRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/eod", eodRoutes);

const adminRoutes = require("./routes/adminRoutes");
const bankRoutes = require("./routes/bankRoutes");
const leaveRoutes = require("./routes/leaveRoutes");

app.use("/api/admin", adminRoutes);
app.use("/api/banks", bankRoutes);
app.use("/api/leaves", leaveRoutes);
const documentRoutes = require("./routes/documentRoutes");
app.use("/api/documents", documentRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("🚀 Backend is Running Successfully...");
});

const PORT = process.env.PORT || 5000;

const server = process.env.NODE_ENV !== "test" 
  ? app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    }) 
  : null;

// Initialize WebSocket logic for managing data streams
if (server) {
  const { initWebSocket } = require("./services/websocket");
  initWebSocket(server);
}

// Handle unhandled promise rejections gracefully
process.on("unhandledRejection", (err) => {
  console.log("❌ Unhandled Rejection! Shutting down gracefully...");
  console.log(err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
});

// Handle uncaught exceptions gracefully
process.on("uncaughtException", (err) => {
  console.log("❌ Uncaught Exception! Shutting down gracefully...");
  console.log(err.name, err.message);
  process.exit(1);
});

module.exports = app;
