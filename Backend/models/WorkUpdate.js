const mongoose = require("mongoose");

const workUpdateSchema = new mongoose.Schema(
  {
    employeeDbId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employeeId: {
      type: String,
      required: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    teamName: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      required: [true, "Update Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Update Description is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["Pending", "In Progress", "Completed"],
      default: "Completed",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WorkUpdate", workUpdateSchema);
