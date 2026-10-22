import { io } from "socket.io-client";

// Clean and resolve the backend WebSocket URL
const getBackendSocketUrl = () => {
  let raw = (import.meta.env.VITE_API_URL || "").trim();
  if (!raw) {
    if (
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ) {
      raw = "http://localhost:5000";
    } else {
      raw = "https://mhaveer.onrender.com";
    }
  }
  raw = raw.replace(/\/+$/, "");
  if (raw.endsWith("/api")) {
    raw = raw.slice(0, -4);
  }
  return raw;
};

// Retrieve current auth metadata from localStorage
export const getAuthPayload = () => {
  try {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    return {
      token: token || "",
      userId: user?._id || user?.id || "",
      role: user?.role || "",
      department: user?.department || "",
      name: user?.name || user?.fullName || "",
    };
  } catch (e) {
    return {};
  }
};

const BACKEND_URL = getBackendSocketUrl();

const socket = io(BACKEND_URL, {
  withCredentials: true,
  autoConnect: true,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  auth: (cb) => {
    cb(getAuthPayload());
  },
});

// Explicitly send authentication to ensure server joins appropriate manager/employee rooms
export const authenticateSocket = (user, token) => {
  try {
    const payload = {
      token: token || localStorage.getItem("token") || "",
      userId: user?._id || user?.id || "",
      role: user?.role || "",
      department: user?.department || "",
      name: user?.name || user?.fullName || "",
    };
    socket.auth = payload;
    if (!socket.connected) {
      socket.connect();
    } else {
      socket.emit("authenticate", payload);
    }
  } catch (err) {
    console.error("[Socket] authenticate error:", err);
  }
};

// Connection lifecycle handlers
socket.on("connect", () => {
  console.log(`🔌 [Socket Client] Connected to server at ${BACKEND_URL} (Socket ID: ${socket.id})`);
  const auth = getAuthPayload();
  if (auth.userId || auth.role) {
    socket.emit("authenticate", auth);
  }
});

socket.on("authenticated", (res) => {
  console.log(`✅ [Socket Client] Successfully authenticated with server:`, res);
});

socket.on("connect_error", (err) => {
  console.warn("⚠️ [Socket Client] Connection error:", err.message);
});

socket.on("reconnect", (attempt) => {
  console.log(`🔄 [Socket Client] Reconnected on attempt ${attempt}`);
  const auth = getAuthPayload();
  if (auth.userId || auth.role) {
    socket.emit("authenticate", auth);
  }
});

export default socket;
