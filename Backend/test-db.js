const mongoose = require("mongoose");
const Attendance = require("./models/Attendance");
const dns = require("dns");

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

mongoose.connect("mongodb+srv://kevinshah2809_db_user:Labdhi2807@cluster0.iaz4ibx.mongodb.net/MhaveerDB?retryWrites=true&w=majority&appName=Cluster0").then(async () => {
  console.log("Connected to MongoDB");
  const att = await Attendance.find();
  console.log("Total Attendance Records:", att.length);
  if (att.length > 0) {
    console.log("Sample Attendance:", att[0]);
  }
  process.exit();
}).catch(console.error);
