const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    personalEmail: {
      type: String,
      required: true,
      trim: true,
    },
    officialEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    aadhaarNumber: { type: String, default: "" },
    panNumber: { type: String, default: "" },
    fatherPhone: { type: String, default: "" },
    motherPhone: { type: String, default: "" },
    guardianPhone: { type: String, default: "" },
    bankName: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    accountHolderName: { type: String, default: "" },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    dob: {
      type: Date,
    },
    password: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
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
    reportingTo: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Employee", employeeSchema);