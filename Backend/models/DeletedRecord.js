const mongoose = require("mongoose");

const deletedRecordSchema = new mongoose.Schema(
  {
    originalId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    originalCollection: {
      type: String,
      required: true,
      index: true,
    },
    recordType: {
      type: String,
      required: true,
      index: true,
    },
    originalData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    deletedBy: {
      userId: { type: String, default: null },
      userObjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
      name: { type: String, default: null },
      role: { type: String, default: null },
    },
    employeeId: {
      type: String,
      default: null,
      index: true,
    },
    employeeObjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    deletedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    deletionReason: {
      type: String,
      default: "User requested deletion",
    },
    originalCreatedAt: {
      type: Date,
      default: null,
    },
    originalUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "deleted_records", // Strictly one centralized collection
    timestamps: false,
    strict: false, // Allows full preservation of any custom/dynamic attributes in originalData
  }
);

// Compound indexes for audit and recovery lookups
deletedRecordSchema.index({ originalCollection: 1, originalId: 1 });
deletedRecordSchema.index({ deletedAt: -1 });

module.exports = mongoose.model("DeletedRecord", deletedRecordSchema);

