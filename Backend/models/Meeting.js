const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    location: {
      type: String,
    },
    type: {
      type: String,
      default: "Consultation",
    },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled", "Rescheduled"],
      default: "Scheduled",
    },
    notes: {
      type: String,
    },
    followUpDate: {
      type: Date,
    },
    // Original creator (Telecalling agent or whoever created the meeting)
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    // ── Sales Department Assignment ──────────────────────────────────────
    // The Sales employee this meeting is assigned to (separate from creator)
    salesAssignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    salesAssignedToName: {
      type: String,
      default: null,
    },
    // "Assigned" = has a Sales employee | "Unassigned" = all slots full
    salesAssignmentStatus: {
      type: String,
      enum: ["Assigned", "Unassigned"],
      default: "Unassigned",
    },
    // Department that originated this meeting record
    department: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast Sales employee queries
meetingSchema.index({ salesAssignedTo: 1 });
meetingSchema.index({ salesAssignmentStatus: 1 });

module.exports = mongoose.model("Meeting", meetingSchema);