const mongoose = require("mongoose");

const companyDocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Document title is required"],
      trim: true,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL/file is required"],
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: String,
      default: "Manager",
    },
    uploadedByRole: {
      type: String,
      default: "Manager",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CompanyDocument", companyDocumentSchema);
