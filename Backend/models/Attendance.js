const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true
    },
    employeeName: {
      type: String,
      required: true,
    },
    officialEmail: {
      type: String,
    },
    role: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
    },
    loginTime: {
      type: Date,
    },
    logoutTime: {
      type: Date,
      default: null,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Working", "On Break", "Completed", "Not Started"],
      default: "Working",
    },
    breaks: [
      {
        startTime: { type: Date },
        endTime: { type: Date },
      },
    ],
    totalBreakMinutes: {
      type: Number,
      default: 0,
    },
    totalWorkingMinutes: {
      type: Number,
      default: 0,
    },
    totalWorkingHours: {
      type: String,
      default: "00:00",
    },
    managerId: {
      type: String,
    },
    managerName: {
      type: String,
    },
    teamLeaderId: {
      type: String,
    },
    teamLeaderName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance records per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);