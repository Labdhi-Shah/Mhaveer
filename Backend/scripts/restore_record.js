/**
 * Standalone Database Recovery CLI Tool
 *
 * Usage:
 *   node scripts/restore_record.js --archiveId=<id>
 *   node scripts/restore_record.js --originalId=<id> --collection=<collectionName>
 *
 * Example:
 *   node scripts/restore_record.js --originalId=6afad19cd52194500efb8b91 --collection=leads
 */

const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const DeletedRecord = require("../models/DeletedRecord");
const Lead = require("../models/Lead");
const Meeting = require("../models/Meeting");
const Employee = require("../models/Employee");
const Customer = require("../models/Customer");
const CompanyDocument = require("../models/CompanyDocument");
const Eod = require("../models/Eod");
const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");
const { restoreRecord } = require("../services/archiveService");

const MODEL_MAP = {
  leads: Lead,
  meetings: Meeting,
  employees: Employee,
  customers: Customer,
  companydocuments: CompanyDocument,
  eods: Eod,
  leaves: Leave,
  attendances: Attendance,
};

async function main() {
  const args = process.argv.slice(2);
  const params = {};
  args.forEach((arg) => {
    const [k, v] = arg.replace(/^--/, "").split("=");
    if (k && v) params[k] = v;
  });

  if (!params.archiveId && !params.originalId) {
    console.error("Error: Please provide either --archiveId=<id> or --originalId=<id>");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB Atlas.");

  const query = params.archiveId
    ? { _id: params.archiveId }
    : { originalId: params.originalId };

  const archived = await DeletedRecord.findOne(query);
  if (!archived) {
    console.error("Archived record not found in deleted_records collection.");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Found archived record:`);
  console.log(` - Archive ID: ${archived._id}`);
  console.log(` - Original ID: ${archived.originalId}`);
  console.log(` - Original Collection: ${archived.originalCollection}`);
  console.log(` - Record Type: ${archived.recordType}`);
  console.log(` - Deleted At: ${archived.deletedAt}`);
  console.log(` - Deleted By: ${JSON.stringify(archived.deletedBy)}`);

  const collectionName = params.collection || archived.originalCollection;
  const targetModel = MODEL_MAP[collectionName.toLowerCase()];

  if (!targetModel) {
    console.error(`Unknown collection model for "${collectionName}". Registered models: ${Object.keys(MODEL_MAP).join(", ")}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const result = await restoreRecord({
    archiveId: archived._id,
    targetModel,
  });

  if (result.success) {
    console.log(`\nSUCCESS: ${result.message}`);
  } else {
    console.error(`\nFAILED: ${result.message}`);
  }

  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Fatal Error:", err);
    process.exit(1);
  });
}

