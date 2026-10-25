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
    companyTurnover1: {
      type: Number,
    },
    companyTurnover2: {
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
    // Property Purchase Loan fields
    propertyPurchaseCategory: {
      type: String,
    },
    ppLocation: {
      type: String,
    },
    ppMarketRate: {
      type: mongoose.Schema.Types.Mixed,
    },
    ppDastavejRate: {
      type: mongoose.Schema.Types.Mixed,
    },
    ppDastavejName: {
      type: String,
    },
    // Property Loan fields
    propertyLoanCategory: {
      type: String,
    },
    propertyLocation: {
      type: String,
    },
    durationOfRentProperty: {
      type: String,
    },
    lapPropertyType: {
      type: String,
    },
    lapPropertyLocation: {
      type: String,
    },
    lapPropertyMarketValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    lapPropertyWork: {
      type: String,
    },
    lapPropertyDocumentList: {
      type: String,
    },
    unsoldUnit: {
      type: String,
    },
    unsoldMV: {
      type: mongoose.Schema.Types.Mixed,
    },
    unsoldBV: {
      type: mongoose.Schema.Types.Mixed,
    },
    unsoldScheme: {
      type: String,
    },
    unsoldLocation: {
      type: String,
    },
    unsoldFloor: {
      type: String,
    },
    unsoldDastavej: {
      type: String,
    },
    unsoldPartnership: {
      type: String,
    },
    lrdRent: {
      type: mongoose.Schema.Types.Mixed,
    },
    lrdMarketValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    lrdLocation: {
      type: String,
    },
    lrdLoiYear: {
      type: String,
    },
    lrdSchemeName: {
      type: String,
    },
    lrdDastavej: {
      type: String,
    },
    naPlotLocation: {
      type: String,
    },
    naPlotMV: {
      type: mongoose.Schema.Types.Mixed,
    },
    naPlotYesNo: {
      type: mongoose.Schema.Types.Mixed,
    },
    naPlotDastavej: {
      type: String,
    },
    naPlotVAR: {
      type: String,
    },
    naPlotScheme: {
      type: String,
    },
    naPlotLavani: {
      type: String,
    },
    naPlotVacant: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Business Loan fields
    businessLoanType: {
      type: String,
    },
    businessStartingYear: {
      type: String,
    },
    businessTypeOfWork: {
      type: String,
    },
    // Balance Transfer fields
    btBankName: {
      type: String,
    },
    btRateOfInterest: {
      type: String,
    },
    btPropertyType: {
      type: String,
    },
    btMarketValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    btLocation: {
      type: String,
    },
    btDuration: {
      type: String,
    },
    btOutstanding: {
      type: mongoose.Schema.Types.Mixed,
    },
    btForeclosureCharge: {
      type: String,
    },
    remarks: {
      type: String,
    },
    employeeCode: {
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