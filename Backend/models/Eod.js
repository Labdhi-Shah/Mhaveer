const mongoose = require("mongoose");

const eodSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee ID is required"],
      index: true,
    },
    employeeCode: {
      type: String,
      trim: true,
      index: true,
    },
    employeeName: {
      type: String,
      required: [true, "Employee name is required"],
      trim: true,
    },
    officialEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    submissionDate: {
      type: String, // Stored as "YYYY-MM-DD"
      required: [true, "Submission date is required"],
      index: true,
      validate: {
        validator: function (v) {
          return /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));
        },
        message: (props) => `${props.value} is not a valid date format (expected YYYY-MM-DD)`,
      },
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    received: {
      type: Number,
      required: [true, "Received leads count is required"],
      min: [0, "Received count must be a non-negative number"],
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
      default: 0,
    },
    appointment: {
      type: Number,
      required: [true, "Appointments count is required"],
      min: [0, "Appointment count must be a non-negative number"],
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
      default: 0,
    },
    login: {
      type: Number,
      required: [true, "Logins count is required"],
      min: [0, "Login count must be a non-negative number"],
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
      default: 0,
    },
    managerId: {
      type: String,
      default: "",
    },
    managerName: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate submissions for the same employee and date
eodSchema.index({ employeeId: 1, submissionDate: 1 }, { unique: true });
eodSchema.index({ submissionDate: 1 });

module.exports = mongoose.model("Eod", eodSchema);

