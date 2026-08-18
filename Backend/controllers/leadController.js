const Lead = require("../models/Lead");
const Employee = require("../models/Employee");
const Meeting = require("../models/Meeting");
const { assignMeetingToSalesEmployee } = require("../services/salesAssignmentService");

// @desc    Create a new lead
// @route   POST /api/leads
exports.createLead = async (req, res) => {
  try {
    // If the user is an employee, attach their info to the lead
    let employeeName = "";
    let officialEmail = "";
    let role = req.user.role;
    let managerId = "";
    let managerName = "";
    let teamLeaderId = "";
    let teamLeaderName = "";
    
    if (req.user.id) {
      const employee = await Employee.findById(req.user.id);
      if (employee) {
        employeeName = employee.name;
        officialEmail = employee.officialEmail;
        managerId = employee.managerId || "";
        managerName = employee.managerName || "";
        teamLeaderId = employee.teamLeaderId || "";
        teamLeaderName = employee.teamLeaderName || "";
      }
    }

    const leadData = {
      ...req.body,
      employeeId: req.user.id || null,
      employeeName,
      officialEmail,
      managerId,
      managerName,
      teamLeaderId,
      teamLeaderName,
      role,
      createdBy: req.user.id || "System",
    };

    const lead = new Lead(leadData);
    await lead.save();

    // If meeting details exist, create a corresponding Meeting record automatically
    // and trigger Sales department assignment
    if (lead.meetingDate) {
      const meeting = new Meeting({
        title: "Initial Consultation",
        leadId: lead._id,
        customerName: lead.contactPerson || lead.companyName,
        customerPhone: lead.phoneNumber,
        date: lead.meetingDate,
        time: lead.meetingTime || "10:00 AM",
        location: lead.address || "",
        type: "Consultation",
        status: "Scheduled",
        notes: `Created from New Lead Entry. Interested: ${lead.interested}`,
        employeeId: lead.employeeId,
        employeeName: lead.employeeName,
        department: req.user.department || "",
      });
      await meeting.save();
      // Auto-assign to Sales employee (non-fatal if it fails)
      try {
        await assignMeetingToSalesEmployee(meeting);
      } catch (assignErr) {
        console.error("[SalesAssignment] Lead meeting assignment error:", assignErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: `Invalid value provided for ${error.path}` });
    }
    console.error("Create Lead Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message, stack: error.stack });
  }
};

// @desc    Get all leads
// @route   GET /api/leads
exports.getLeads = async (req, res) => {
  try {
    let query = {};
    
    // Filtering
    const search = req.query.search;
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
        { leadId: { $regex: search, $options: "i" } }
      ];
    }
    
    if (req.query.loanType) query.loanType = req.query.loanType;
    if (req.query.interested) query.interested = req.query.interested;
    
    // If not super admin, restrict according to role hierarchy
    if (req.user.role !== "SuperAdmin" && req.user.role !== "Admin") {
      let hierarchyFilter = {};
      if (req.user.role === "Manager") {
        const teamLeaders = await Employee.find({ managerId: req.user.id, role: "Team Leader" }).select('_id');
        const tlIds = teamLeaders.map(tl => tl._id.toString());
        hierarchyFilter = {
          $or: [
            { employeeId: req.user.id },
            { managerId: req.user.id },
            { teamLeaderId: { $in: tlIds } }
          ]
        };
      } else if (req.user.role === "Team Leader") {
        hierarchyFilter = {
          $or: [
            { employeeId: req.user.id },
            { teamLeaderId: req.user.id }
          ]
        };
      } else {
        hierarchyFilter = { employeeId: req.user.id };
      }

      if (query.$or) {
        query.$and = [{ $or: query.$or }, hierarchyFilter];
        delete query.$or;
      } else {
        Object.assign(query, hierarchyFilter);
      }
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const leads = await Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Lead.countDocuments(query);
    const pages = Math.ceil(total / limit);
    
    res.status(200).json({
      success: true,
      message: "Leads fetched successfully",
      data: leads,
      total,
      pages: pages || 1
    });
  } catch (error) {
    console.error("Get Leads Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    let isAuthorized = false;
    if (req.user.role === "SuperAdmin" || req.user.role === "Admin") isAuthorized = true;
    else if (lead.employeeId === req.user.id) isAuthorized = true;
    else if (req.user.role === "Manager") {
      if (lead.managerId === req.user.id) isAuthorized = true;
      else if (lead.teamLeaderId) {
        const tl = await Employee.findById(lead.teamLeaderId);
        if (tl && tl.managerId === req.user.id) isAuthorized = true;
      }
    } else if (req.user.role === "Team Leader" && lead.teamLeaderId === req.user.id) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Not authorized to access this lead" });
    }
    res.status(200).json({
      success: true,
      message: "Lead fetched successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Get Lead Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
exports.updateLead = async (req, res) => {
  try {
    let lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    let isAuthorized = false;
    if (req.user.role === "SuperAdmin" || req.user.role === "Admin") isAuthorized = true;
    else if (lead.employeeId === req.user.id) isAuthorized = true;
    else if (req.user.role === "Manager") {
      if (lead.managerId === req.user.id) isAuthorized = true;
      else if (lead.teamLeaderId) {
        const tl = await Employee.findById(lead.teamLeaderId);
        if (tl && tl.managerId === req.user.id) isAuthorized = true;
      }
    } else if (req.user.role === "Team Leader" && lead.teamLeaderId === req.user.id) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Not authorized to update this lead" });
    }

    lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (lead.meetingDate) {
      let meeting = await Meeting.findOne({ leadId: lead._id });
      if (meeting) {
        meeting.date = lead.meetingDate;
        meeting.time = lead.meetingTime || meeting.time;
        meeting.customerName = lead.contactPerson || lead.companyName;
        meeting.customerPhone = lead.phoneNumber;
        meeting.location = lead.address || "";
        await meeting.save();
      } else {
        const newMeeting = new Meeting({
          title: "Initial Consultation",
          leadId: lead._id,
          customerName: lead.contactPerson || lead.companyName,
          customerPhone: lead.phoneNumber,
          date: lead.meetingDate,
          time: lead.meetingTime || "10:00 AM",
          location: lead.address || "",
          type: "Consultation",
          status: "Scheduled",
          notes: `Created from Lead Update. Interested: ${lead.interested}`,
          employeeId: lead.employeeId,
          employeeName: lead.employeeName,
          department: req.user.department || "",
        });
        await newMeeting.save();
        // Auto-assign to Sales employee (non-fatal)
        try {
          await assignMeetingToSalesEmployee(newMeeting);
        } catch (assignErr) {
          console.error("[SalesAssignment] Lead update meeting assignment error:", assignErr.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: lead,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    console.error("Update Lead Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    let isAuthorized = false;
    if (req.user.role === "SuperAdmin" || req.user.role === "Admin") isAuthorized = true;
    else if (lead.employeeId === req.user.id) isAuthorized = true;
    else if (req.user.role === "Manager") {
      if (lead.managerId === req.user.id) isAuthorized = true;
      else if (lead.teamLeaderId) {
        const tl = await Employee.findById(lead.teamLeaderId);
        if (tl && tl.managerId === req.user.id) isAuthorized = true;
      }
    } else if (req.user.role === "Team Leader" && lead.teamLeaderId === req.user.id) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this lead" });
    }

    await lead.deleteOne();

    res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
      data: {},
    });
  } catch (error) {
    console.error("Delete Lead Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};