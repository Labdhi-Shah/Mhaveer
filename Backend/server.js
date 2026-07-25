const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

// Connect Database
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Loan Backend API Running...");
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  if (email === "admin@example.com" && password === "password") {
    return res.json({
      success: true,
      token: "dummy-auth-token",
      role: "admin",
      message: "Login successful.",
    });
  }

  return res.status(401).json({ success: false, message: "Invalid email or password." });
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }

  return res.json({ success: true, message: `Password reset link sent to ${email}.` });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});