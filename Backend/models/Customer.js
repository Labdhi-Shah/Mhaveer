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
    }]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Customer", customerSchema);