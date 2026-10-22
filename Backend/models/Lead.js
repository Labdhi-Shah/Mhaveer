const mongoose = require("mongoose");

function getFieldValue(ctx, field) {
  if (ctx && ctx[field] !== undefined) return ctx[field];
  if (ctx && typeof ctx.getUpdate === "function") {
    const update = ctx.getUpdate();
    if (update) {
      if (update[field] !== undefined) return update[field];
      if (update.$set && update.$set[field] !== undefined) return update.$set[field];
    }
  }
  return undefined;
}

const leadSchema = new mongoose.Schema(
  {
    leadId: {
      type: String,
      unique: true,
    },
    companyName: {
      type: String,
      required: function () {
        const callStatus = getFieldValue(this, "callStatus");
        return callStatus !== "Wrong Number";
      },
      trim: true,
    },
    contactPerson: {
      type: String,
      required: function () {
        const callStatus = getFieldValue(this, "callStatus");
        return callStatus !== "Wrong Number";
      },
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone Number is required"],
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    companyTurnover: {
      type: Number,
    },
    loanAmount: {
      type: Number,
    },
    loanType: {
      type: String,
      required: function () {
        const interested = getFieldValue(this, "interested");
        const callStatus = getFieldValue(this, "callStatus");
        return interested === "Yes" && callStatus !== "Wrong Number";
      },
    },
    propertyLoanCategory: {
      type: String,
    },
    cibilScore: {
      type: Number,
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
    },
    meetingTime: {
      type: String,
    },
    followUpDate: {
      type: Date,
      required: function () {
        const interested = getFieldValue(this, "interested");
        const callStatus = getFieldValue(this, "callStatus");
        return interested === "Call Back Later" || callStatus === "Busy";
      },
    },
    followUpTime: {
      type: String,
      required: function () {
        const interested = getFieldValue(this, "interested");
        const callStatus = getFieldValue(this, "callStatus");
        return interested === "Call Back Later" || callStatus === "Busy";
      },
    },
    address: {
      type: String,
    },
    employeeId: {
      type: String,
    },
    employeeName: {
      type: String,
    },
    officialEmail: {
      type: String,
    },
    role: {
      type: String,
    },
    createdBy: {
      type: String,
    },
    status: {
      type: String,
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
  },
  {
    timestamps: true,
    strict: false
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