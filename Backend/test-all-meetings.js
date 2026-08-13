const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://kevinshah2809_db_user:Labdhi2807@cluster0.iaz4ibx.mongodb.net/MhaveerDB?retryWrites=true&w=majority&appName=Cluster0").then(async () => {
  const Meeting = require("./models/Meeting");
  const Lead = require("./models/Lead");
  
  const allMeetings = await Meeting.find().populate("leadId");
  console.log("All Meetings:", JSON.stringify(allMeetings, null, 2));
  
  process.exit(0);
}).catch(console.error);