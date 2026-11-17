const mongoose = require("mongoose");
const DeletedRecord = require("../models/DeletedRecord");

// Ensure collection & indexes are ready
DeletedRecord.init().catch((err) => {
  console.warn("[archiveService] Index init notice:", err.message);
});

/**
 * Extracts employee metadata from a document and/or reqUser.
 */
function extractEmployeeInfo(doc = {}, reqUser = {}) {
  let employeeId = null;
  let employeeObjectId = null;

  if (doc.employeeCode) {
    employeeId = String(doc.employeeCode);
  } else if (doc.employeeId && typeof doc.employeeId === "string" && !mongoose.Types.ObjectId.isValid(doc.employeeId)) {
    employeeId = doc.employeeId;
  } else if (reqUser?.employeeId) {
    employeeId = String(reqUser.employeeId);
  }

  if (doc.employeeId && mongoose.Types.ObjectId.isValid(doc.employeeId)) {
    employeeObjectId = new mongoose.Types.ObjectId(doc.employeeId);
  } else if (doc._id && (doc.role === "Employee" || doc.officialEmail)) {
    employeeObjectId = new mongoose.Types.ObjectId(doc._id);
    if (!employeeId && doc.employeeId) {
      employeeId = String(doc.employeeId);
    }
  }

  return { employeeId, employeeObjectId };
}

/**
 * Formats deletedBy metadata from reqUser.
 */
function formatDeletedBy(reqUser = {}) {
  const userId = reqUser?.id || reqUser?._id?.toString() || "system";
  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : null;

  return {
    userId: String(userId),
    userObjectId,
    name: reqUser?.name || reqUser?.fullName || null,
    role: reqUser?.role || "User",
  };
}

/**
 * Safely archives a document to `deleted_records` and deletes it from its original collection.
 * Uses official MongoDB session.withTransaction() with automatic retry on transient errors.
 *
 * @param {Object} options
 * @param {mongoose.Model} options.model - The Mongoose model of the document
 * @param {string|mongoose.Types.ObjectId} options.id - The _id of the document to delete
 * @param {Object} [options.query] - Optional additional match query
 * @param {Object} [options.reqUser] - The authenticated user object
 * @param {string} [options.deletionReason] - Reason for deletion
 * @param {string} [options.recordType] - Optional custom recordType name
 * @param {Array<{ model: mongoose.Model, query: Object, recordType: string }>} [options.cascade] - Related documents to also archive and delete
 * @returns {Promise<{ success: boolean, archivedRecord: Object, originalDoc: Object, cascaded: Array }>}
 */
async function archiveAndDelete({
  model,
  id,
  query = {},
  reqUser = {},
  deletionReason = "",
  recordType = "",
  cascade = [],
}) {
  if (!model) {
    throw new Error("archiveAndDelete requires a valid Mongoose model.");
  }
  if (!id && Object.keys(query).length === 0) {
    throw new Error("archiveAndDelete requires a document ID or query.");
  }

  const lookupQuery = id ? { _id: id, ...query } : { ...query };
  const collectionName = model.collection.name;
  const inferredType = recordType || model.modelName.toLowerCase();
  const defaultReason = deletionReason || `Deleted by ${reqUser?.role || "user"}`;
  const deletedBy = formatDeletedBy(reqUser);

  let session = null;
  let supportsTx = false;

  try {
    session = await mongoose.startSession();
    supportsTx = true;
  } catch (err) {
    supportsTx = false;
  }

  if (supportsTx && session) {
    try {
      let finalResult = null;

      await session.withTransaction(async () => {
        // Step 1: Find original document within transaction
        const originalDoc = await model.findOne(lookupQuery).session(session);
        if (!originalDoc) {
          finalResult = { success: false, notFound: true, message: `${model.modelName} not found` };
          return;
        }

        const rawDoc = originalDoc.toObject ? originalDoc.toObject() : originalDoc;
        const { employeeId, employeeObjectId } = extractEmployeeInfo(rawDoc, reqUser);

        // Step 2: Create Archive Copy in `deleted_records`
        const archivePayload = {
          originalId: originalDoc._id,
          originalCollection: collectionName,
          recordType: inferredType,
          originalData: rawDoc,
          deletedBy,
          employeeId,
          employeeObjectId,
          deletedAt: new Date(),
          deletionReason: defaultReason,
          originalCreatedAt: rawDoc.createdAt || null,
          originalUpdatedAt: rawDoc.updatedAt || null,
        };

        const [archivedRecord] = await DeletedRecord.create([archivePayload], { session });
        if (!archivedRecord || !archivedRecord._id) {
          throw new Error("Failed to create archive document in deleted_records.");
        }

        // Step 3: Archive and delete any cascading related documents
        const cascadedArchived = [];
        if (Array.isArray(cascade) && cascade.length > 0) {
          for (const item of cascade) {
            if (item.model && item.query) {
              const relatedDocs = await item.model.find(item.query).session(session);
              for (const rDoc of relatedDocs) {
                const rawRelated = rDoc.toObject ? rDoc.toObject() : rDoc;
                const rEmp = extractEmployeeInfo(rawRelated, reqUser);
                const rArchive = {
                  originalId: rDoc._id,
                  originalCollection: item.model.collection.name,
                  recordType: item.recordType || item.model.modelName.toLowerCase(),
                  originalData: rawRelated,
                  deletedBy,
                  employeeId: rEmp.employeeId,
                  employeeObjectId: rEmp.employeeObjectId,
                  deletedAt: new Date(),
                  deletionReason: `Cascaded deletion triggered by ${inferredType} (${originalDoc._id})`,
                  originalCreatedAt: rawRelated.createdAt || null,
                  originalUpdatedAt: rawRelated.updatedAt || null,
                };
                const [cArchived] = await DeletedRecord.create([rArchive], { session });
                await item.model.deleteOne({ _id: rDoc._id }, { session });
                cascadedArchived.push(cArchived);
              }
            }
          }
        }

        // Step 4: Delete original document
        const deleteResult = await model.deleteOne({ _id: originalDoc._id }, { session });
        if (deleteResult.deletedCount !== 1) {
          throw new Error(`Failed to delete original document ${originalDoc._id} from ${collectionName}.`);
        }

        finalResult = {
          success: true,
          archivedRecord,
          originalDoc: rawDoc,
          cascaded: cascadedArchived,
        };
      });

      return finalResult;
    } catch (txError) {
      // If transactions are not supported or withTransaction fails permanently, fall back to safe sequential
      if (txError.message && txError.message.includes("Transaction numbers are only allowed")) {
        // Fallback to non-transactional execution below
      } else {
        throw txError;
      }
    } finally {
      await session.endSession();
    }
  }

  // Non-transactional fallback with verified sequential consistency
  const originalDoc = await model.findOne(lookupQuery);
  if (!originalDoc) {
    return { success: false, notFound: true, message: `${model.modelName} not found` };
  }

  const rawDoc = originalDoc.toObject ? originalDoc.toObject() : originalDoc;
  const { employeeId, employeeObjectId } = extractEmployeeInfo(rawDoc, reqUser);

  const archivePayload = {
    originalId: originalDoc._id,
    originalCollection: collectionName,
    recordType: inferredType,
    originalData: rawDoc,
    deletedBy,
    employeeId,
    employeeObjectId,
    deletedAt: new Date(),
    deletionReason: defaultReason,
    originalCreatedAt: rawDoc.createdAt || null,
    originalUpdatedAt: rawDoc.updatedAt || null,
  };

  const archivedRecord = await DeletedRecord.create(archivePayload);
  if (!archivedRecord || !archivedRecord._id) {
    throw new Error("Archiving failed before deletion. Original record preserved.");
  }

  try {
    const deleteResult = await model.deleteOne({ _id: originalDoc._id });
    if (deleteResult.deletedCount !== 1) {
      await DeletedRecord.deleteOne({ _id: archivedRecord._id });
      throw new Error(`Failed to delete original document ${originalDoc._id} from ${collectionName}.`);
    }

    const cascadedArchived = [];
    if (Array.isArray(cascade) && cascade.length > 0) {
      for (const item of cascade) {
        if (item.model && item.query) {
          const relatedDocs = await item.model.find(item.query);
          for (const rDoc of relatedDocs) {
            const rawRelated = rDoc.toObject ? rDoc.toObject() : rDoc;
            const rEmp = extractEmployeeInfo(rawRelated, reqUser);
            const rArchive = await DeletedRecord.create({
              originalId: rDoc._id,
              originalCollection: item.model.collection.name,
              recordType: item.recordType || item.model.modelName.toLowerCase(),
              originalData: rawRelated,
              deletedBy,
              employeeId: rEmp.employeeId,
              employeeObjectId: rEmp.employeeObjectId,
              deletedAt: new Date(),
              deletionReason: `Cascaded deletion triggered by ${inferredType} (${originalDoc._id})`,
              originalCreatedAt: rawRelated.createdAt || null,
              originalUpdatedAt: rawRelated.updatedAt || null,
            });
            await item.model.deleteOne({ _id: rDoc._id });
            cascadedArchived.push(rArchive);
          }
        }
      }
    }

    return {
      success: true,
      archivedRecord,
      originalDoc: rawDoc,
      cascaded: cascadedArchived,
    };
  } catch (deleteErr) {
    await DeletedRecord.deleteOne({ _id: archivedRecord._id });
    throw deleteErr;
  }
}

/**
 * Technical recovery function to safely restore an archived document to its original collection.
 */
async function restoreRecord({ archiveId, originalId, targetModel }) {
  if (!targetModel) {
    throw new Error("restoreRecord requires targetModel.");
  }

  const query = archiveId ? { _id: archiveId } : { originalId };
  const archived = await DeletedRecord.findOne(query);

  if (!archived) {
    return { success: false, message: "Archived record not found in deleted_records." };
  }

  // Safety check: ensure original record does not already exist
  const existing = await targetModel.findById(archived.originalId);
  if (existing) {
    return {
      success: false,
      message: `Document with ID ${archived.originalId} already exists in ${targetModel.collection.name}. Aborting restoration to prevent overwrite.`,
    };
  }

  const restoredDoc = await targetModel.create(archived.originalData);

  return {
    success: true,
    restoredDoc,
    message: `Document ${archived.originalId} successfully restored to ${targetModel.collection.name}.`,
  };
}

module.exports = {
  archiveAndDelete,
  restoreRecord,
};
