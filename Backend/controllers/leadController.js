const Lead = require("../models/Lead");
const Employee = require("../models/Employee");

// @desc    Create a new lead
// @route   POST /api/leads
exports.createLead = async (req, res) => {
  try {
    // If the user is an employee, attach their info to the lead
    let employeeName = "";
    let officialEmail = "";
    let role = req.user.role;
    
    if (req.user.id) {
      const employee = await Employee.findById(req.user.id);
      if (employee) {
        employeeName = employee.name;
        officialEmail = employee.officialEmail;
      }
    }

    const leadData = {
      ...req.body,
      employeeId: req.user.id || null,
      employeeName,
      officialEmail,
      role,
      createdBy: req.user.id || "System",
    };

    const lead = new Lead(leadData);
    await lead.save();

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
    
    // If not super admin, restrict to their own leads
    if (req.user.role !== "SuperAdmin") {
      query.employeeId = req.user.id;
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

    if (req.user.role !== "SuperAdmin" && lead.employeeId !== req.user.id) {
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

    if (req.user.role !== "SuperAdmin" && lead.employeeId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to update this lead" });
    }

    lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
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

    if (req.user.role !== "SuperAdmin" && lead.employeeId !== req.user.id) {
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
