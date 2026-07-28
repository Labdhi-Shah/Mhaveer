const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    leadId: {
      type: String,
      unique: true,
    },
    companyName: {
      type: String,
      required: [true, "Company Name is required"],
      trim: true,
    },
    contactPerson: {
      type: String,
      required: [true, "Contact Person is required"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone Number is required"],
      match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9"],
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    yearlyIncome: {
      type: Number,
      required: [true, "Yearly Income is required"],
    },
    loanAmount: {
      type: Number,
      required: [true, "Loan Amount is required"],
    },
    loanType: {
      type: String,
      required: [true, "Loan Type is required"],
    },
    cibilScore: {
      type: Number,
      required: [true, "CIBIL Score is required"],
    },
    interested: {
      type: String,
      required: [true, "Interested status is required"],
    },
    callStatus: {
      type: String,
      required: [true, "Call Status is required"],
    },
    meetingDate: {
      type: Date,
      validate: {
        validator: function (v) {
          if (!v) return true; // not required
          // Cannot be in the past
          return v >= new Date().setHours(0, 0, 0, 0);
        },
        message: "Meeting Date cannot be in the past",
      },
    },
    meetingTime: {
      type: String,
    },
    followUpDate: {
      type: Date,
      required: function () {
        return this.interested === "Call Back Later";
      },
    },
    followUpTime: {
      type: String,
      required: function () {
        return this.interested === "Call Back Later";
      },
    },
    remarks: {
      type: String,
    },
    employeeId: {
      type: String,
    },
    employeeName: {
      type: String,
    },
    employeeRole: {
      type: String,
    },
    status: {
      type: String,
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate leadId automatically
leadSchema.pre("save", function () {
  if (!this.leadId) {
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
    this.leadId = `LD-${randomNum}`;
  }
});

module.exports = mongoose.model("Lead", leadSchema);
