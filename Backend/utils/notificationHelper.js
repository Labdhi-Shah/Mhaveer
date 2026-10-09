const Notification = require("../models/Notification");

// We'll export a simple function to create notifications
exports.createNotification = async ({ recipient, isForManager, title, message, type, relatedId }) => {
  try {
    const notif = new Notification({
      recipient,
      isForManager,
      title,
      message,
      type,
      relatedId
    });
    await notif.save();
    
    // We can emit a websocket event here if needed
    // However, the existing logic just calls socket.emit("data-updated") in the controllers
    // But we can also emit a specific notification event if needed
    const { getIO } = require("../services/websocket");
    const io = getIO();
    if (io) {
      io.emit("notification-updated");
    }
    
    return notif;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};
