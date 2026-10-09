const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: false, // if null, it might be for all admins/managers
  },
  isForManager: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["REMINDER", "INFO", "ALERT", "NEW_LEAD", "UPDATE"],
    default: "INFO",
  },
  read: {
    type: Boolean,
    default: false,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId, // Can be Lead or Meeting ID
    required: false,
  }
}, { timestamps: true });

module.exports = mongoose.model("Notification", NotificationSchema);
