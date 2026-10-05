const { Server } = require("socket.io");

let io;

const initWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",")
        : [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://192.168.29.244:5173",
            "http://192.168.1.21:5173",
            "https://mhaveer.vercel.app",
          ],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Example of handling high-frequency data streams (1000+ records)
    socket.on("stream-data", (data) => {
      // Logic for batching or handling large data to avoid API/Server overload
      // E.g., batching 100 records and saving to DB, or throttling event emission
      console.log(`Received large data batch of size: ${data?.length || 0}`);
      
      // Broadcast or acknowledge processing
      socket.emit("data-processed", { status: "success", count: data?.length || 0 });
    });

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized!");
  }
  return io;
};

module.exports = { initWebSocket, getIO };
