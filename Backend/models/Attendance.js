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
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    totalWorkingMinutes: {
      type: Number,
      default: 0,
    },
    totalWorkingHours: {
      type: String,
      default: "00:00",
    },
    status: {
      type: String,
      enum: ["Working", "Completed"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance records per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
