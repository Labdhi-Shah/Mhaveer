const mongoose = require("mongoose");
const uri = "mongodb+srv://kevinshah2809_db_user:Labdhi2807@cluster0.iaz4ibx.mongodb.net/MhaveerDB?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const meetings = await db.collection("meetings").find({ customerPhone: "7882032124" }).toArray();
  console.log("MEETINGS:", JSON.stringify(meetings, null, 2));

  const leads = await db.collection("leads").find({ phone: "7882032124" }).toArray();
  console.log("LEADS:", JSON.stringify(leads, null, 2));

  const employees = await db.collection("employees").find({ name: { $regex: /kevin/i } }).toArray();
  console.log("EMPLOYEES:", JSON.stringify(employees, null, 2));

  process.exit(0);
}).catch(console.error);
