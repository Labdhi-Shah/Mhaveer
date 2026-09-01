const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const customerSchema = new mongoose.Schema(
  {
    // ── Core Identity ────────────────────────────────────────────────────────
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ""
    },

    // ── Loan Details ─────────────────────────────────────────────────────────
    loanType: {
      type: String,
      required: true
    },
    propertyLoanType: {
      // Sub-type when loanType === "Property Loan"
      type: String,
      default: ""
    },
    loanAmount: {
      type: Number,
      default: 0
    },

    // ── Eligibility (from form step 2) ───────────────────────────────────────
    eligibility: {
      age: { type: String, default: "" },
      income: { type: String, default: "" },
      employmentType: { type: String, default: "" },
      companyName: { type: String, default: "" },
      govDepartment: { type: String, default: "" },
      businessName: { type: String, default: "" },
      annualTurnover: { type: String, default: "" },
      gstNumber: { type: String, default: "" }
    },
    cibilScore: {
      type: String,
      default: ""
    },

    // ── Source Reference ─────────────────────────────────────────────────────
    // The Meeting this form was filled for (nullable — can also be standalone)
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      default: null
    },

    // ── Sales Rep ────────────────────────────────────────────────────────────
    salesRepresentativeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    salesRepresentativeName: {
      type: String,
      required: true
    },

    // ── Status ───────────────────────────────────────────────────────────────
    status: {
      type: String,
      default: "Pending Verification"
    },

    // ── Documents ────────────────────────────────────────────────────────────
    documents: {
      aadhaar: documentSchema,
      pan: documentSchema,
      bankStatement: documentSchema,
      salaryOrItr: documentSchema,
      addressProof: documentSchema,
      businessDocs: documentSchema,
      propertyDocs: documentSchema,
      // Legacy fields kept for backwards compatibility
      passportPhoto: documentSchema,
      electricityBill: documentSchema,
      itr: documentSchema,
      gstCertificate: documentSchema,
      rationCard: documentSchema
    },

    // -- Common Fields --
    loanPurpose: { type: String, default: "" },
    preferredTenure: { type: String, default: "" },

    // -- Dynamic Documents --
    dynamicDocuments: [{
      category: String,
      documentType: String,
      personIndex: { type: Number, default: -1 }, // Used if the document belongs to a specific owner/partner/director index
      file: {
        filename: String,
        originalName: String,
        path: String,
        mimeType: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now }
      }
    }],

    // ── Credit Department Details ────────────────────────────────────────────
    creditStatus: {
      type: String,
      default: "Pending Credit Review" // Default state when Sales submits
    },
    creditAssignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null
    },
    creditAssignedEmployeeId: {
      type: String,
      default: ""
    },
    creditAssignedEmployeeName: {
      type: String,
      default: ""
    },
    documentVerification: {
      type: Map,
      of: new mongoose.Schema({
        status: { type: String, enum: ["Pending", "Verified", "Rejected"], default: "Pending" },
        remark: { type: String, default: "" }
      }, { _id: false }),
      default: {}
    },
    creditDetails: {
      monthlyIncome: { type: Number, default: 0 },
      annualIncome: { type: Number, default: 0 },
      existingEmi: { type: Number, default: 0 },
      existingLoanAmount: { type: Number, default: 0 },
      foir: { type: Number, default: 0 },
      loanEligibilityAmount: { type: Number, default: 0 }
    },
    creditRemarks: {
      type: String,
      default: ""
    },
    creditReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null
    },
    creditReviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Customer", customerSchema);