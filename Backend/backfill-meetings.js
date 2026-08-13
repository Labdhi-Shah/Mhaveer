const mongoose = require("mongoose");
const dns = require("dns");

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const Lead = require("./models/Lead");
const Meeting = require("./models/Meeting");

mongoose.connect("mongodb+srv://kevinshah2809_db_user:Labdhi2807@cluster0.iaz4ibx.mongodb.net/MhaveerDB?retryWrites=true&w=majority&appName=Cluster0").then(async () => {
  console.log("Connected to MongoDB for Backfilling Meetings...");

  // Find all Leads that have a meetingDate but no corresponding Meeting document
  const leadsWithMeetings = await Lead.find({ meetingDate: { $ne: null } });
  console.log(`Found ${leadsWithMeetings.length} Leads with a meetingDate.`);

  let createdCount = 0;
  let alreadyExistedCount = 0;

  for (const lead of leadsWithMeetings) {
    const existingMeeting = await Meeting.findOne({ leadId: lead._id });
    if (existingMeeting) {
      alreadyExistedCount++;
      continue;
    }

    // Create the missing meeting document
    const newMeeting = new Meeting({
      title: "Initial Consultation (Backfilled)",
      leadId: lead._id,
      customerName: lead.contactPerson || lead.companyName || "Unknown",
      customerPhone: lead.phoneNumber || "",
      date: lead.meetingDate,
      time: lead.meetingTime || "10:00 AM",
      location: lead.address || "",
      type: "Consultation",
      status: "Scheduled", // Meetings use "Scheduled", not Lead's "Active"
      notes: `Backfilled from Old Lead. Interested: ${lead.interested || 'Unknown'}`,
      employeeId: lead.employeeId || lead._id, // fallback if employeeId missing
      employeeName: lead.employeeName || "System",
    });

    await newMeeting.save();
    console.log(`Created Meeting for Lead: ${lead.leadId} on ${lead.meetingDate}`);
    createdCount++;
  }

  console.log(`\nBackfill Complete.`);
  console.log(`- Meetings created: ${createdCount}`);
  console.log(`- Meetings already existed: ${alreadyExistedCount}`);

  process.exit(0);
}).catch(console.error);