import { io } from "socket.io-client";

// URL Options:
// const BACKEND_URL = "http://localhost:5000";
// const BACKEND_URL = "http://192.168.1.21:5000";
// const BACKEND_URL = "http://172.20.10.2:5000";
// const BACKEND_URL = "https://mhaveer.onrender.com";

const rawAPI = import.meta.env.VITE_API_URL || "https://mhaveer.onrender.com";
const BACKEND_URL = rawAPI.endsWith("/") ? rawAPI.slice(0, -1) : rawAPI;

const socket = io(BACKEND_URL, {
  withCredentials: true,
  autoConnect: false, // Prevents auto-connecting, you can connect it manually where needed using socket.connect()
});

export default socket;
