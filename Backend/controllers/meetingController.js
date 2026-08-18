const Meeting = require("../models/Meeting");
const Lead = require("../models/Lead");
const Employee = require("../models/Employee");
const {
  assignMeetingToSalesEmployee,
  assignPendingMeetings,
  getSalesEmployeeStats,
  getAssignedCount,
  MAX_MEETINGS_PER_EMPLOYEE,
} = require("../services/salesAssignmentService");

// ──────────────────────────────────────────────────────────────────────────────
// Helper: normalise department string (mirrors authMiddleware)
// ──────────────────────────────────────────────────────────────────────────────
const normalizeDept = (v = "") => {
  const l = v.toLowerCase();
  if (l.includes("kyc") || l.includes("compliance")) return "Sales";
  if (l.includes("sales")) return "Sales";
  if (l.includes("telecalling") || l.includes("lead generation")) return "Telecalling";
  if (l.includes("lead")) return "Leads";
  if (l.includes("admin")) return "Admin";
  return v;
};

const normalizeRole = (v = "") => {
  const l = v.toLowerCase();
  if (l === "manager") return "Manager";
  if (l === "team leader" || l === "tl" || l === "teamleader") return "Team Leader";
  if (l === "admin" || l === "superadmin") return "Admin";
  return v;
};


// ──────────────────────────────────────────────────────────────────────────────
// Get meetings — role/department-aware
// ──────────────────────────────────────────────────────────────────────────────
exports.getMeetings = async (req, res) => {
  try {
    const userRole = normalizeRole(req.user.role || "");
    const userDept = normalizeDept(req.user.department || "");
    const userId = req.user.id;

    let query = {};

    if (userRole === "Admin") {
      // Admin sees everything
      query = {};
    } else if (userDept === "Sales") {
      // STRICT ISOLATION: All Sales roles (Manager, Team Leader, Employee) 
      // ONLY see meetings directly assigned to them.
      query = { salesAssignedTo: userId };
    } else {
      // Telecalling, Leads, or other departments: see their own created meetings
      query = { employeeId: userId };
    }

    // Auto-update logic: mark past Scheduled meetings as Completed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await Meeting.updateMany(
      { date: { $lt: today }, status: "Scheduled" },
      { $set: { status: "Completed" } }
    );

    const meetings = await Meeting.find(query)
      .populate("leadId")
      .populate("salesAssignedTo", "name officialEmail")
      .sort({ date: 1, time: 1 });

    res.status(200).json({ success: true, data: meetings });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Get a single meeting
// ──────────────────────────────────────────────────────────────────────────────
exports.getSingleMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate("salesAssignedTo", "name officialEmail");
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    const userRole = normalizeRole(req.user.role || "");
    const userDept = normalizeDept(req.user.department || "");

    // Access check
    const isAdmin = userRole === "Admin";
    const isSalesManager = userDept === "Sales" && userRole === "Manager";
    const isSalesEmployee =
      userDept === "Sales" &&
      meeting.salesAssignedTo?.toString() === req.user.id;
    const isCreator = meeting.employeeId?.toString() === req.user.id;

    if (!isAdmin && !isSalesManager && !isSalesEmployee && !isCreator) {
      return res.status(403).json({ success: false, message: "Unauthorized to view this meeting" });
    }

    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    console.error("Error fetching single meeting:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Update meeting
// ──────────────────────────────────────────────────────────────────────────────
exports.updateMeeting = async (req, res) => {
  try {
    let meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    const userRole = normalizeRole(req.user.role || "");
    const userDept = normalizeDept(req.user.department || "");

    const isAdmin = userRole === "Admin";
    const isSalesManager = userDept === "Sales" && userRole === "Manager";
    const isSalesAssignee =
      userDept === "Sales" &&
      meeting.salesAssignedTo?.toString() === req.user.id;
    const isCreator = meeting.employeeId?.toString() === req.user.id;

    if (!isAdmin && !isSalesManager && !isSalesAssignee && !isCreator) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this meeting" });
    }

    meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    
    // Trigger assignment asynchronously to fill any newly freed slots
    assignPendingMeetings().catch(err => console.error("Auto-assignment error after update:", err.message));
    
    res.status(200).json({ success: true, message: "Meeting updated successfully", data: meeting });
  } catch (error) {
    console.error("Error updating meeting:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Delete / Cancel Meeting
// ──────────────────────────────────────────────────────────────────────────────
exports.deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    const userRole = normalizeRole(req.user.role || "");
    const isAdmin = userRole === "Admin";
    const isCreator = meeting.employeeId?.toString() === req.user.id;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this meeting" });
    }

    await meeting.deleteOne();
    res.status(200).json({ success: true, message: "Meeting deleted successfully" });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// [Sales Manager] Get Sales department overview stats
// GET /api/meetings/sales-dashboard-stats
// ──────────────────────────────────────────────────────────────────────────────
exports.getSalesDashboardStats = async (req, res) => {
  try {
    const userRole = normalizeRole(req.user.role || "");
    const userDept = normalizeDept(req.user.department || "");

    if (userDept !== "Sales" || (userRole !== "Manager" && userRole !== "Team Leader")) {
      return res.status(403).json({ success: false, message: "Access denied: Sales Manager or Team Leader only" });
    }

    const stats = await getSalesEmployeeStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching sales dashboard stats:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// [Sales Employee] Get personal meeting stats
// GET /api/meetings/sales-employee-stats
// ──────────────────────────────────────────────────────────────────────────────
exports.getSalesEmployeeMyStats = async (req, res) => {
  try {
    const userRole = normalizeRole(req.user.role || "");
    const userDept = normalizeDept(req.user.department || "");

    if (userDept !== "Sales") {
      return res.status(403).json({ success: false, message: "Access denied: Sales department only" });
    }

    const userId = req.user.id;
    const assignedCount = await getAssignedCount(userId);
    const remainingCapacity = Math.max(0, MAX_MEETINGS_PER_EMPLOYEE - assignedCount);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysMeetings = await Meeting.countDocuments({
      salesAssignedTo: userId,
      date: { $gte: today, $lt: new Date(today.getTime() + 86400000) },
      status: "Scheduled",
    });

    const scheduledMeetings = await Meeting.countDocuments({
      salesAssignedTo: userId,
      status: "Scheduled",
    });

    const completedMeetings = await Meeting.countDocuments({
      salesAssignedTo: userId,
      status: "Completed",
    });

    res.status(200).json({
      success: true,
      data: {
        assignedCount,
        maxCapacity: MAX_MEETINGS_PER_EMPLOYEE,
        remainingCapacity,
        todaysMeetings,
        scheduledMeetings,
        completedMeetings,
      },
    });
  } catch (error) {
    console.error("Error fetching sales employee stats:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// [Sales Manager] Trigger assignment of pending/unassigned meetings
// POST /api/meetings/assign-unassigned
// ──────────────────────────────────────────────────────────────────────────────
exports.assignUnassignedMeetings = async (req, res) => {
  try {
    const userRole = normalizeRole(req.user.role || "");
    const userDept = normalizeDept(req.user.department || "");

    if (userDept !== "Sales" || userRole !== "Manager") {
      return res.status(403).json({ success: false, message: "Access denied: Sales Manager only" });
    }

    const result = await assignPendingMeetings();
    res.status(200).json({
      success: true,
      message: `Assignment complete. ${result.newlyAssigned} meetings assigned, ${result.stillUnassigned} still unassigned.`,
      data: result,
    });
  } catch (error) {
    console.error("Error assigning unassigned meetings:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};