const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const fixIndexes = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;
    const collection = db.collection("employees");

    console.log("Checking indexes...");
    const indexes = await collection.indexes();
    console.log("Existing indexes:", indexes.map((i) => i.name));

    try {
      console.log("Dropping index email_1...");
      await collection.dropIndex("email_1");
      console.log("Successfully dropped old index email_1!");
    } catch (err) {
      console.log("Index email_1 might not exist or already dropped:", err.message);
    }

    mongoose.connection.close();
    console.log("Done.");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

fixIndexes();
