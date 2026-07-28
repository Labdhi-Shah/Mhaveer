const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    attendanceId: {
      type: String,
      unique: true,
    },
    employeeId: {
      type: String,
      required: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    officialEmail: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
    },
    loginTime: {
      type: Date,
    },
    logoutTime: {
      type: Date,
    },
    workingHours: {
      type: String,
    },
    status: {
      type: String,
      default: "Present",
    },
    breaks: [
      {
        startTime: { type: Date },
        endTime: { type: Date }
      }
    ],
    totalBreakTime: {
      type: String,
      default: "00:00"
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate attendanceId automatically
attendanceSchema.pre("save", function () {
  if (!this.attendanceId) {
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
    this.attendanceId = `ATT-${randomNum}`;
  }
});

module.exports = mongoose.model("Attendance", attendanceSchema);
