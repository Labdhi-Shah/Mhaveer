const mongoose = require("mongoose");
const uri = "mongodb+srv://kevinshah2809_db_user:Labdhi2807@cluster0.iaz4ibx.mongodb.net/MhaveerDB?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const meetings = await db.collection("meetings").find({ $or: [{ customerName: { $regex: /kevin/i } }, { "leadId.contactPerson": { $regex: /kevin/i } }] }).toArray();
  console.log("MEETINGS WITH KEVIN:", JSON.stringify(meetings, null, 2));

  const meetings2 = await db.collection("meetings").find({ customerPhone: { $regex: /7882032124/ } }).toArray();
  console.log("MEETINGS BY PHONE:", JSON.stringify(meetings2, null, 2));

  const leads = await db.collection("leads").find({ companyName: { $regex: /pashwa/i } }).toArray();
  console.log("LEADS BY COMPANY:", JSON.stringify(leads, null, 2));

  process.exit(0);
}).catch(console.error);
