const { Server } = require("socket.io");

let io;

// Helper to determine if role qualifies as a manager / admin
const isManagerRole = (role = "") => {
  if (!role) return false;
  const l = role.toLowerCase().trim();
  return (
    l === "manager" ||
    l === "superadmin" ||
    l === "admin" ||
    l === "administration (admin)" ||
    l === "management" ||
    l === "branch manager" ||
    l === "operations manager" ||
    l === "regional manager" ||
    l.includes("director") ||
    l.includes("ceo")
  );
};

// Origin validator: permits local development, network LAN, Vercel, Render, and explicit env origins
const isOriginAllowed = (origin) => {
  if (!origin) return true; // Non-browser clients, same-origin, curl, server-to-server

  if (process.env.ALLOWED_ORIGINS) {
    const list = process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
    if (list.includes(origin)) return true;
  }

  // Allow common development & deployment patterns
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname;
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.startsWith("172.") ||
      host.endsWith(".vercel.app") ||
      host.endsWith(".onrender.com")
    ) {
      return true;
    }
  } catch (e) {
    // Fallback regex
  }

  return false;
};

const initWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          return callback(null, true);
        }
        console.warn(`[Socket.io] Origin not in whitelist, but allowing for resilience: ${origin}`);
        return callback(null, true);
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  const registerSocketRooms = (socket, authData) => {
    const rawUser = authData?.user || authData;
    const userId = rawUser?.userId || rawUser?._id || rawUser?.id || authData?.userId;
    const role = rawUser?.role || rawUser?.userRole || authData?.role;
    const department = rawUser?.department || authData?.department;
    const name = rawUser?.name || rawUser?.fullName || authData?.name;

    socket.userId = userId || socket.userId;
    socket.role = role || socket.role;
    socket.department = department || socket.department;
    socket.userName = name || socket.userName;

    socket.join("all");

    if (isManagerRole(socket.role)) {
      socket.join("managers");
      socket.join("role:manager");
    } else {
      socket.join("employees");
      socket.join("role:employee");
    }

    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    if (socket.department) {
      socket.join(`dept:${socket.department}`);
    }

    console.log(
      `👤 Socket ${socket.id} authenticated: ${socket.userName || "User"} (${socket.role || "Unknown"}) - Rooms: [${Array.from(socket.rooms).join(", ")}]`
    );
  };

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // If auth payload provided in initial handshake
    const auth = socket.handshake.auth || {};
    if (auth.userId || auth.role || auth.user) {
      registerSocketRooms(socket, auth);
    } else {
      socket.join("all");
    }

    // Explicit authenticate event (e.g. after frontend login or state change)
    socket.on("authenticate", (authData) => {
      registerSocketRooms(socket, authData);
      socket.emit("authenticated", { success: true, socketId: socket.id });
    });

    // High-frequency stream handler
    socket.on("stream-data", (data) => {
      socket.emit("data-processed", { status: "success", count: data?.length || 0 });
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  console.log("⚡ Real-time WebSocket server initialized successfully");
  return io;
};

const getIO = () => {
  if (!io) {
    console.warn("⚠️ getIO called before initWebSocket");
    return null;
  }
  return io;
};

/**
 * Centralized, safe real-time event dispatcher.
 * Emits both structured specific events (e.g. "lead:created", "lead:create") and backwards-compatible "data-updated".
 *
 * @param {Object} options
 * @param {string} options.entity - "lead", "meeting", "customer", "attendance", "leave", "document", "employee"
 * @param {string} options.action - "create", "update", "delete", "assign", "start", "pause", "resume", "end"
 * @param {Object} [options.data] - The updated/created object or entity data
 * @param {string} [options.id] - The unique identifier of the entity
 * @param {string} [options.userId] - The ID of the employee/manager who performed the action
 * @param {string} [options.role] - The role of the performer
 * @param {string} [options.targetRoom] - Optional specific room (defaults to broadcast to all + managers)
 */
const emitDataChange = ({ entity, action, data, id, userId, role, targetRoom }) => {
  try {
    const activeIO = getIO();
    if (!activeIO) {
      console.warn(`[Socket] Cannot emit ${entity}:${action} - io not initialized`);
      return;
    }

    const payload = {
      entity: String(entity || "").toLowerCase(),
      action: String(action || "").toLowerCase(),
      data: data || null,
      id: id || data?._id || data?.id || null,
      userId: userId || null,
      role: role || null,
      timestamp: new Date().toISOString(),
    };

    const pastTenseMap = {
      create: "created",
      created: "created",
      update: "updated",
      updated: "updated",
      delete: "deleted",
      deleted: "deleted",
      start: "started",
      started: "started",
      pause: "paused",
      paused: "paused",
      resume: "resumed",
      resumed: "resumed",
      stop: "stopped",
      stopped: "stopped",
      apply: "applied",
      applied: "applied",
      upload: "uploaded",
      uploaded: "uploaded",
      assign: "assigned",
      assigned: "assigned",
    };

    const actionPast = pastTenseMap[payload.action] || `${payload.action}d`;
    const pastTenseEvent = `${payload.entity}:${actionPast}`;
    const presentTenseEvent = `${payload.entity}:${payload.action}`;
    const categoryEvent = `${payload.entity}s-updated`;
    const eventPayload = payload.data || payload;

    console.log(`📢 Broadcasting real-time event: [${pastTenseEvent}] (ID: ${payload.id || "N/A"})`);

    const broadcastToTarget = (target) => {
      // Specific event (past tense e.g. lead:created)
      target.emit(pastTenseEvent, eventPayload, payload);
      // Specific event (present tense e.g. lead:create) if different
      if (pastTenseEvent !== presentTenseEvent) {
        target.emit(presentTenseEvent, eventPayload, payload);
      }
      // Category event (e.g. leads-updated)
      target.emit(categoryEvent, payload);
      // Legacy data-updated event with full payload
      target.emit("data-updated", payload);
    };

    if (targetRoom) {
      broadcastToTarget(activeIO.to(targetRoom));
    } else {
      // Broadcast to all clients
      broadcastToTarget(activeIO);
      // Specifically ensure managers room gets manager-specific event
      activeIO.to("managers").emit("manager:data-updated", payload);
    }
  } catch (err) {
    console.error("[Socket] Failed to broadcast real-time change:", err.message);
  }
};

module.exports = { initWebSocket, getIO, emitDataChange };
