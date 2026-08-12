const Meeting = require("../models/Meeting");
const Lead = require("../models/Lead");

// Create a new meeting
exports.createMeeting = async (req, res) => {
  try {
    const { title, leadId, customerName, customerPhone, date, time, location, type, status, notes, followUpDate } = req.body;
    
    const newMeeting = new Meeting({
      title,
      leadId: leadId || null,
      customerName,
      customerPhone,
      date,
      time,
      location,
      type,
      status,
      notes,
      followUpDate,
      employeeId: req.user.id,
      employeeName: req.user.name || "Unknown Employee"
    });

    await newMeeting.save();

    res.status(201).json({ success: true, message: "Meeting created successfully", data: newMeeting });
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Get meetings for the logged-in user (or team for managers)
exports.getMeetings = async (req, res) => {
  try {
    // Basic implementation: fetch meetings for the logged in employee
    // In a full implementation, you'd apply hierarchy logic (team leader sees team's meetings, etc.)
    const userRole = req.user.role ? req.user.role.toLowerCase() : "";
    const userDepartment = req.user.department ? req.user.department.toLowerCase() : "";
    let query = {};
    
    if (userRole.includes("admin") || userRole === "superadmin" || userDepartment.includes("sales")) {
      // Admin and Sales see all meetings
    } else {
      query.employeeId = req.user.id;
    }

    // Auto-update logic: Mark past Scheduled meetings as Completed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await Meeting.updateMany(
      { date: { $lt: today }, status: "Scheduled" },
      { $set: { status: "Completed" } }
    );

    const meetings = await Meeting.find(query).populate("leadId").sort({ date: 1, time: 1 });
    res.status(200).json({ success: true, data: meetings });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Get a single meeting
exports.getSingleMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }
    // Verify access
    const userRole = req.user.role ? req.user.role.toLowerCase() : "";
    if (!userRole.includes("admin") && userRole !== "superadmin" && meeting.employeeId.toString() !== req.user.id) {
       return res.status(403).json({ success: false, message: "Unauthorized to view this meeting" });
    }
    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    console.error("Error fetching single meeting:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Update meeting
exports.updateMeeting = async (req, res) => {
  try {
    let meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    // Authorization
    const userRole = req.user.role ? req.user.role.toLowerCase() : "";
    if (!userRole.includes("admin") && userRole !== "superadmin" && meeting.employeeId.toString() !== req.user.id) {
       return res.status(403).json({ success: false, message: "Unauthorized to update this meeting" });
    }

    meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: "Meeting updated successfully", data: meeting });
  } catch (error) {
    console.error("Error updating meeting:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Delete / Cancel Meeting
exports.deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    // Authorization
    const userRole = req.user.role ? req.user.role.toLowerCase() : "";
    if (!userRole.includes("admin") && userRole !== "superadmin" && meeting.employeeId.toString() !== req.user.id) {
       return res.status(403).json({ success: false, message: "Unauthorized to delete this meeting" });
    }

    await meeting.deleteOne();
    res.status(200).json({ success: true, message: "Meeting deleted successfully" });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
