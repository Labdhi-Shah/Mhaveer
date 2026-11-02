const mongoose = require("mongoose");
const dns = require("dns");

// Set public DNS servers to avoid querySrv ECONNREFUSED issues on local networks/Windows environments
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.warn("⚠️ DNS: Failed to set custom DNS servers, using system default:", e.message);
}

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoURI) {
    console.warn("⚠️ Warning: MONGODB_URI or MONGO_URI is not set in environment.");
  }

  try {
    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB Disconnected! Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB Reconnected!");
    });

    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.log("❌ MongoDB Connection Error:", error.message);
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
