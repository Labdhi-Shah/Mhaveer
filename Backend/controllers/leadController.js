const Lead = require("../models/Lead");
const Employee = require("../models/Employee");
const Meeting = require("../models/Meeting");
const { assignMeetingToSalesEmployee } = require("../services/salesAssignmentService");
const { getIO, emitDataChange } = require("../services/websocket");
const { createNotification } = require("../utils/notificationHelper");

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
    let employeeCode = "";
    
    if (req.user.id) {
      const employee = await Employee.findById(req.user.id);
      if (employee) {
        employeeName = employee.name;
        officialEmail = employee.officialEmail;
        managerId = employee.managerId || "";
        managerName = employee.managerName || "";
        teamLeaderId = employee.teamLeaderId || "";
        teamLeaderName = employee.teamLeaderName || "";
        employeeCode = employee.employeeId || "";
      }
    }

    const leadData = {
      ...req.body,
      employeeId: req.user.id || null,
      employeeCode,
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

    emitDataChange({
      entity: "lead",
      action: "create",
      data: lead,
      id: lead._id,
      userId: req.user.id,
      role: req.user.role,
    });

    if (managerId) {
      await createNotification({
        isForManager: true,
        title: "New Lead Added",
        message: `${employeeName} added a new lead: ${lead.companyName}`,
        type: "NEW_LEAD",
        relatedId: lead._id
      });
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
        { leadId: { $regex: search, $options: "i" } },
        { employeeName: { $regex: search, $options: "i" } },
        { employeeCode: { $regex: search, $options: "i" } }
      ];
    }
    
    if (req.query.loanType) query.loanType = req.query.loanType;
    if (req.query.interested) query.interested = req.query.interested;
    
    // If not super admin, restrict according to role hierarchy
    if (req.user.role !== "SuperAdmin" && req.user.role !== "Admin" && req.user.role !== "Administration (Admin)" && req.user.role !== "Manager") {
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

    let leads = await Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

    // Enrich any lead that might be missing employeeName or officialEmail
    const missingEmpIds = [
      ...new Set(
        leads
          .filter(l => (!l.employeeName || !l.officialEmail) && (l.employeeId || (l.createdBy && l.createdBy !== "System")))
          .map(l => (l.employeeId || l.createdBy).toString())
      )
    ];
    if (missingEmpIds.length > 0) {
      const mongoose = require("mongoose");
      const validObjectIds = missingEmpIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      const emps = await Employee.find({
        $or: [
          ...(validObjectIds.length > 0 ? [{ _id: { $in: validObjectIds } }] : []),
          { employeeId: { $in: missingEmpIds } }
        ]
      }).select("name officialEmail role department employeeId managerName teamLeaderName").lean();

      const empMap = new Map();
      emps.forEach(e => {
        empMap.set(e._id.toString(), e);
        if (e.employeeId) empMap.set(e.employeeId, e);
      });

      leads = leads.map(l => {
        const targetEmpId = l.employeeId ? l.employeeId.toString() : (l.createdBy && l.createdBy !== "System" ? l.createdBy.toString() : null);
        if (targetEmpId) {
          const emp = empMap.get(targetEmpId) || (l.employeeId ? empMap.get(l.employeeId.toString()) : null);
          if (emp) {
            return {
              ...l,
              employeeName: l.employeeName || emp.name,
              officialEmail: l.officialEmail || emp.officialEmail,
              role: l.role || emp.role,
              managerName: l.managerName || emp.managerName,
              teamLeaderName: l.teamLeaderName || emp.teamLeaderName,
              employeeCode: l.employeeCode || emp.employeeId || ""
            };
          }
        }
        return l;
      });
    }

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
    if (req.user.role === "SuperAdmin" || req.user.role === "Admin" || req.user.role === "Manager" || req.user.role === "Administration (Admin)") isAuthorized = true;
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

    let leadData = lead.toObject ? lead.toObject() : lead;
    if (leadData.employeeId) {
      const mongoose = require("mongoose");
      const isValidId = mongoose.Types.ObjectId.isValid(leadData.employeeId);
      const emp = await Employee.findOne({
        $or: [
          ...(isValidId ? [{ _id: leadData.employeeId }] : []),
          { employeeId: leadData.employeeId }
        ]
      }).select("name officialEmail role department employeeId managerName teamLeaderName").lean();
      if (emp) {
        leadData.employeeName = leadData.employeeName || emp.name;
        leadData.officialEmail = leadData.officialEmail || emp.officialEmail;
        leadData.role = leadData.role || emp.role;
        leadData.managerName = leadData.managerName || emp.managerName;
        leadData.teamLeaderName = leadData.teamLeaderName || emp.teamLeaderName;
        leadData.employeeCode = leadData.employeeCode || emp.employeeId || "";
      }
    }

    res.status(200).json({
      success: true,
      message: "Lead fetched successfully",
      data: leadData,
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
    if (req.user.role === "SuperAdmin" || req.user.role === "Admin" || req.user.role === "Manager" || req.user.role === "Administration (Admin)") isAuthorized = true;
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

    if (req.body.phoneNumber) {
      req.body.phone = req.body.phoneNumber;
    } else if (req.body.phone) {
      req.body.phoneNumber = req.body.phone;
    }

    lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    let meeting = await Meeting.findOne({ leadId: lead._id });
    if (meeting) {
      if (lead.meetingDate) {
        meeting.date = lead.meetingDate;
        meeting.time = lead.meetingTime || meeting.time;
        meeting.location = lead.address || "";
      }
      meeting.customerName = lead.contactPerson || lead.companyName;
      if (lead.phoneNumber) {
        meeting.customerPhone = lead.phoneNumber;
      }
      await meeting.save();
    } else if (lead.meetingDate) {
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
        employeeId: lead.employeeId || req.user.id,
        employeeName: lead.employeeName || req.user.name || "Employee",
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

    emitDataChange({
      entity: "lead",
      action: "update",
      data: lead,
      id: lead._id,
      userId: req.user.id,
      role: req.user.role,
    });

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
    if (req.user.role === "SuperAdmin" || req.user.role === "Admin" || req.user.role === "Manager" || req.user.role === "Administration (Admin)") isAuthorized = true;
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

    emitDataChange({
      entity: "lead",
      action: "delete",
      id: req.params.id,
      userId: req.user.id,
      role: req.user.role,
    });

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