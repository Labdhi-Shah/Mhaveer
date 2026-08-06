const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    loanType: {
      type: String,
      required: true
    },
    loanAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      default: "Pending Verification"
    },
    salesRepresentativeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    salesRepresentativeName: {
      type: String,
      required: true
    },
    documents: {
      aadhaar: documentSchema,
      pan: documentSchema,
      passportPhoto: documentSchema,
      bankStatement: documentSchema,
      electricityBill: documentSchema,
      itr: documentSchema,
      gstCertificate: documentSchema,
      rationCard: documentSchema
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Customer", customerSchema);
