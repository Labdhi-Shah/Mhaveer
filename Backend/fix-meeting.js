const mongoose = require("mongoose");
const uri = "mongodb+srv://kevinshah2809_db_user:Labdhi2807@cluster0.iaz4ibx.mongodb.net/MhaveerDB?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  
  // Find the specific meeting where customerName is kevin and fix it to Param
  await db.collection("meetings").updateOne(
    { _id: new mongoose.Types.ObjectId("6a82f5b2f657d9d23f55b3d5") },
    { $set: { customerName: "Param" } }
  );
  
  // And the other one with the same issue
  await db.collection("meetings").updateOne(
    { _id: new mongoose.Types.ObjectId("6a82f3fbf657d9d23f55b3d3") },
    { $set: { customerName: "kevin" } } // Wait, actually the other one's lead has contactPerson: "kevin" so it might be correct
  );

  console.log("Meeting updated successfully.");
  process.exit(0);
}).catch(console.error);
