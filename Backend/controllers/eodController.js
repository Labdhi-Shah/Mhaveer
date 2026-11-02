const mongoose = require("mongoose");
const Eod = require("../models/Eod");
const Employee = require("../models/Employee");
const { emitDataChange } = require("../services/websocket");

// Helper to safely execute model.find with projection
const safeFind = async (model, criteria, projection) => {
  const q = model.find(criteria);
  return typeof q.select === "function" ? await q.select(projection) : await q;
};

// Helper to resolve currently authenticated Employee document
const getAuthenticatedEmployee = async (user) => {
  if (!user) return null;
  const userId = user.id;

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    const emp = await Employee.findById(userId);
    if (emp) return emp;
  }

  if (user.employeeId) {
    const emp = await Employee.findOne({ employeeId: user.employeeId });
    if (emp) return emp;
  }

  if (user.email) {
    const emp = await Employee.findOne({ officialEmail: user.email.toLowerCase() });
    if (emp) return emp;
  }

  return null;
};

// Helper to get all team member ObjectIds assigned to a manager
const getAssignedTeamMemberIds = async (managerUser, managerEmp) => {
  const role = managerUser.role || "";
  const normalizedRole = role.toLowerCase();

  // 1. SuperAdmin / Admin has company-wide visibility
  if (normalizedRole === "superadmin" || normalizedRole === "admin" || normalizedRole === "administration (admin)") {
    const allEmps = await safeFind(Employee, { role: { $nin: ["SuperAdmin", "Admin"] } }, "_id");
    return allEmps.map((e) => e._id);
  }

  const managerIdStr = managerEmp ? String(managerEmp._id) : "";
  const managerEmpCode = managerEmp ? String(managerEmp.employeeId || "") : "";

  // 2. Direct reports assigned to this manager
  const directCriteria = [];
  if (managerIdStr) {
    directCriteria.push({ managerId: managerIdStr });
    directCriteria.push({ reportingTo: managerIdStr });
  }
  if (managerEmpCode) {
    directCriteria.push({ managerId: managerEmpCode });
    directCriteria.push({ reportingTo: managerEmpCode });
  }

  let assignedEmps = [];
  if (directCriteria.length > 0) {
    assignedEmps = await safeFind(Employee, { $or: directCriteria }, "_id role teamLeaderId");
  }

  // 3. Find any employees under Team Leaders assigned to this manager
  const teamLeaderIds = assignedEmps
    .filter((e) => ["Team Leader", "TL", "Teamleader"].includes(e.role))
    .map((e) => String(e._id));

  if (teamLeaderIds.length > 0) {
    const indirectEmps = await safeFind(
      Employee,
      {
        teamLeaderId: { $in: teamLeaderIds },
        role: { $nin: ["Manager", "Admin", "SuperAdmin"] },
      },
      "_id"
    );
    assignedEmps = [...assignedEmps, ...indirectEmps];
  }

  // 4. Fallback if hierarchy is unassigned: assign employees within the same department
  if (assignedEmps.length === 0) {
    const dept = managerUser.department || (managerEmp ? managerEmp.department : "Telecalling");
    let query = { role: { $nin: ["SuperAdmin", "Admin", "Manager"] } };
    if (dept) {
      query.department = { $regex: new RegExp(`^${dept}$`, "i") };
    }
    const deptEmps = await safeFind(Employee, query, "_id");
    return deptEmps.map((e) => e._id);
  }

  // Deduplicate ObjectIds
  const idSet = new Set(assignedEmps.map((e) => String(e._id)));
  return Array.from(idSet).map((id) => new mongoose.Types.ObjectId(id));
};

// ==========================================
// EMPLOYEE APIS
// ==========================================

// @desc    Submit a new EOD
// @route   POST /api/eod
// @access  Private (Employee, Manager, Admin)
exports.submitEod = async (req, res) => {
  try {
    const employee = await getAuthenticatedEmployee(req.user);
    if (!employee) {
      return res.status(401).json({ success: false, message: "Authentication failed. Employee not found." });
    }

    const { submissionDate, received, appointment, login, allowUpdate = false } = req.body;

    // 1. Validate submission date format YYYY-MM-DD
    if (!submissionDate || typeof submissionDate !== "string") {
      return res.status(400).json({ success: false, message: "submissionDate is required (YYYY-MM-DD)." });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(submissionDate) || isNaN(Date.parse(submissionDate))) {
      return res.status(400).json({ success: false, message: "Invalid submissionDate format. Expected YYYY-MM-DD." });
    }

    // 2. Validate numeric counts (must be non-negative integers)
    const rec = Number(received);
    const app = Number(appointment);
    const log = Number(login);

    if (
      isNaN(rec) ||
      isNaN(app) ||
      isNaN(log) ||
      rec < 0 ||
      app < 0 ||
      log < 0 ||
      !Number.isInteger(rec) ||
      !Number.isInteger(app) ||
      !Number.isInteger(log)
    ) {
      return res.status(400).json({
        success: false,
        message: "Received, Appointment, and Login must be non-negative whole numbers (integers).",
      });
    }

    // 3. Prevent duplicate submission for the same employee and date
    const existing = await Eod.findOne({
      employeeId: employee._id,
      submissionDate,
    });

    if (existing) {
      if (allowUpdate) {
        existing.received = rec;
        existing.appointment = app;
        existing.login = log;
        await existing.save();

        emitDataChange({
          entity: "eod",
          action: "update",
          data: existing,
          id: existing._id,
          userId: req.user.id,
        });

        return res.json({
          success: true,
          message: "EOD submission updated successfully.",
          data: existing,
        });
      }

      return res.status(409).json({
        success: false,
        message: `An EOD report has already been submitted for ${submissionDate}. Use the update option to modify it.`,
        existingId: existing._id,
      });
    }

    // 4. Create and save new EOD record
    const newEod = new Eod({
      employeeId: employee._id,
      employeeCode: employee.employeeId || "",
      employeeName: employee.name,
      officialEmail: employee.officialEmail || "",
      submissionDate,
      date: new Date(`${submissionDate}T00:00:00.000Z`),
      received: rec,
      appointment: app,
      login: log,
      managerId: employee.managerId || "",
      managerName: employee.managerName || "",
    });

    await newEod.save();

    emitDataChange({
      entity: "eod",
      action: "create",
      data: newEod,
      id: newEod._id,
      userId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "EOD report submitted successfully.",
      data: newEod,
    });
  } catch (error) {
    console.error("Error submitting EOD:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate EOD submission detected for this date.",
      });
    }
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// @desc    Get only the logged-in employee's EOD records
// @route   GET /api/eod/my
// @access  Private (Employee, Manager, Admin)
exports.getMyEod = async (req, res) => {
  try {
    const employee = await getAuthenticatedEmployee(req.user);
    if (!employee) {
      return res.status(401).json({ success: false, message: "Authentication failed. Employee not found." });
    }

    const { date, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = { employeeId: employee._id };

    if (date) {
      query.submissionDate = date;
    } else if (startDate && endDate) {
      query.submissionDate = { $gte: startDate, $lte: endDate };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      Eod.find(query)
        .sort({ submissionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Eod.countDocuments(query),
    ]);

    return res.json({
      success: true,
      count: records.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit) || 1,
      data: records,
    });
  } catch (error) {
    console.error("Error fetching my EOD records:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// @desc    Get a specific EOD belonging to the logged-in employee
// @route   GET /api/eod/my/:id
// @access  Private (Employee)
exports.getMyEodById = async (req, res) => {
  try {
    const employee = await getAuthenticatedEmployee(req.user);
    if (!employee) {
      return res.status(401).json({ success: false, message: "Authentication failed. Employee not found." });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid EOD record ID." });
    }

    // Strict employee scoping: cannot access another employee's EOD
    const record = await Eod.findOne({ _id: id, employeeId: employee._id });
    if (!record) {
      return res.status(404).json({ success: false, message: "EOD record not found or access denied." });
    }

    return res.json({ success: true, data: record });
  } catch (error) {
    console.error("Error fetching EOD record by ID:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// @desc    Update employee's own EOD
// @route   PUT /api/eod/my/:id
// @access  Private (Employee)
exports.updateMyEod = async (req, res) => {
  try {
    const employee = await getAuthenticatedEmployee(req.user);
    if (!employee) {
      return res.status(401).json({ success: false, message: "Authentication failed. Employee not found." });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid EOD record ID." });
    }

    const record = await Eod.findOne({ _id: id, employeeId: employee._id });
    if (!record) {
      return res.status(404).json({ success: false, message: "EOD record not found or access denied." });
    }

    const { submissionDate, received, appointment, login } = req.body;

    if (received !== undefined) {
      const rec = Number(received);
      if (isNaN(rec) || rec < 0 || !Number.isInteger(rec)) {
        return res.status(400).json({ success: false, message: "Received count must be a non-negative integer." });
      }
      record.received = rec;
    }

    if (appointment !== undefined) {
      const app = Number(appointment);
      if (isNaN(app) || app < 0 || !Number.isInteger(app)) {
        return res.status(400).json({ success: false, message: "Appointment count must be a non-negative integer." });
      }
      record.appointment = app;
    }

    if (login !== undefined) {
      const log = Number(login);
      if (isNaN(log) || log < 0 || !Number.isInteger(log)) {
        return res.status(400).json({ success: false, message: "Login count must be a non-negative integer." });
      }
      record.login = log;
    }

    if (submissionDate && submissionDate !== record.submissionDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(submissionDate) || isNaN(Date.parse(submissionDate))) {
        return res.status(400).json({ success: false, message: "Invalid date format. Expected YYYY-MM-DD." });
      }

      // Check conflict with another record for this employee
      const conflict = await Eod.findOne({
        _id: { $ne: record._id },
        employeeId: employee._id,
        submissionDate,
      });
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: `An EOD record already exists for ${submissionDate}.`,
        });
      }

      record.submissionDate = submissionDate;
      record.date = new Date(`${submissionDate}T00:00:00.000Z`);
    }

    await record.save();

    emitDataChange({
      entity: "eod",
      action: "update",
      data: record,
      id: record._id,
      userId: req.user.id,
    });

    return res.json({
      success: true,
      message: "EOD record updated successfully.",
      data: record,
    });
  } catch (error) {
    console.error("Error updating my EOD record:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// @desc    Delete employee's own EOD
// @route   DELETE /api/eod/my/:id
// @access  Private (Employee)
exports.deleteMyEod = async (req, res) => {
  try {
    const employee = await getAuthenticatedEmployee(req.user);
    if (!employee) {
      return res.status(401).json({ success: false, message: "Authentication failed. Employee not found." });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid EOD record ID." });
    }

    const record = await Eod.findOneAndDelete({ _id: id, employeeId: employee._id });
    if (!record) {
      return res.status(404).json({ success: false, message: "EOD record not found or access denied." });
    }

    emitDataChange({
      entity: "eod",
      action: "delete",
      data: { id: record._id },
      id: record._id,
      userId: req.user.id,
    });

    return res.json({ success: true, message: "EOD record deleted successfully." });
  } catch (error) {
    console.error("Error deleting EOD record:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// ==========================================
// MANAGER APIS
// ==========================================

// @desc    Get EOD submissions from manager's assigned team members
// @route   GET /api/eod/team
// @access  Private (Manager, Admin, Team Leader)
exports.getTeamEod = async (req, res) => {
  try {
    const managerEmp = await getAuthenticatedEmployee(req.user);
    const assignedIds = await getAssignedTeamMemberIds(req.user, managerEmp);

    if (!assignedIds || assignedIds.length === 0) {
      return res.json({ success: true, count: 0, total: 0, data: [] });
    }

    const { date, search, page = 1, limit = 100 } = req.query;

    const query = { employeeId: { $in: assignedIds } };

    if (date) {
      query.submissionDate = date;
    }

    if (search && typeof search === "string" && search.trim()) {
      query.employeeName = { $regex: search.trim(), $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      Eod.find(query)
        .sort({ submissionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Eod.countDocuments(query),
    ]);

    return res.json({
      success: true,
      count: records.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit) || 1,
      data: records,
    });
  } catch (error) {
    console.error("Error fetching team EOD records:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// @desc    Get EOD records for a specific employee within the manager's team
// @route   GET /api/eod/team/:employeeId
// @access  Private (Manager, Admin, Team Leader)
exports.getTeamEodByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { date } = req.query;

    const managerEmp = await getAuthenticatedEmployee(req.user);
    const assignedIds = await getAssignedTeamMemberIds(req.user, managerEmp);

    // Look up target employee by ObjectId or string employeeId
    const isObjectId = mongoose.Types.ObjectId.isValid(employeeId);
    const targetCriteria = [{ employeeId: employeeId }];
    if (isObjectId) {
      targetCriteria.push({ _id: employeeId });
    }

    const targetEmp = await Employee.findOne({ $or: targetCriteria });
    if (!targetEmp) {
      return res.status(404).json({ success: false, message: "Target employee not found." });
    }

    // Verify manager can only view their own assigned team members
    const isAssigned = assignedIds.some((id) => String(id) === String(targetEmp._id));
    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: You cannot view EOD records for employees outside your assigned team.",
      });
    }

    const query = { employeeId: targetEmp._id };
    if (date) {
      query.submissionDate = date;
    }

    const records = await Eod.find(query).sort({ submissionDate: -1, createdAt: -1 });

    return res.json({
      success: true,
      count: records.length,
      employee: {
        id: targetEmp._id,
        employeeId: targetEmp.employeeId,
        name: targetEmp.name,
      },
      data: records,
    });
  } catch (error) {
    console.error("Error fetching team member EOD by ID:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};
