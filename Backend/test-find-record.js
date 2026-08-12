const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://kevinshah2809_db_user:Labdhi2807@cluster0.iaz4ibx.mongodb.net/MhaveerDB?retryWrites=true&w=majority&appName=Cluster0").then(async () => {
  const Lead = require("./models/Lead");
  const Meeting = require("./models/Meeting");
  
  const leadMatch = await Lead.findOne({ status: "Active", meetingTime: "10:15" });
  if (leadMatch) {
    console.log("Found in Lead Collection:", leadMatch._id, leadMatch.meetingDate, leadMatch.status);
  } else {
    console.log("Not found in Lead collection.");
  }
  
  const meetingMatch = await Meeting.findOne({ time: "10:15" });
  if (meetingMatch) {
    console.log("Found in Meeting Collection:", meetingMatch._id, meetingMatch.date, meetingMatch.status);
  } else {
    console.log("Not found in Meeting collection.");
  }
  
  process.exit(0);
}).catch(console.error);
