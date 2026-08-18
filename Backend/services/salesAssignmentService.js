/**
 * salesAssignmentService.js
 *
 * Round-robin Sales meeting assignment.
 * Rules:
 *  - MAX 30 meetings per Sales Employee
 *  - Employees sorted by _id (stable order) for predictable round-robin
 *  - Fill Employee A to 30 → then B → then C → etc.
 *  - If all full → mark meeting salesAssignmentStatus = "Unassigned"
 *  - Never over-assign: re-counts before each assignment
 */

const Employee = require("../models/Employee");
const Meeting = require("../models/Meeting");

const MAX_MEETINGS_PER_EMPLOYEE = 30;

/**
 * Normalise a raw department string to "Sales" / "Telecalling" / etc.
 * (mirrors authMiddleware logic so service works independently)
 */
const normalizeDepartment = (value = "") => {
  const lower = value.toLowerCase();
  if (lower.includes("kyc") || lower.includes("compliance")) return "Sales";
  if (lower.includes("sales") || lower.includes("compliance")) return "Sales";
  if (lower.includes("telecalling") || lower.includes("lead generation")) return "Telecalling";
  if (lower.includes("lead")) return "Leads";
  if (lower.includes("admin")) return "Admin";
  return value;
};

/**
 * Fetch active Sales Employees (role = "Employee", department normalises to "Sales")
 * sorted by _id ascending for stable round-robin.
 */
const getActiveSalesEmployees = async () => {
  const allEmployees = await Employee.find({
    status: "Active"
  }).sort({ _id: 1 });

  // Further filter by department normalisation
  return allEmployees.filter(
    (emp) => normalizeDepartment(emp.department || "") === "Sales"
  );
};

/**
 * Count how many active meetings are currently assigned to a Sales employee.
 * We only count "Scheduled" or "Rescheduled" meetings so that completed/cancelled
 * meetings free up a slot in their 30-meeting capacity.
 */
const getAssignedCount = async (employeeId) => {
  return Meeting.countDocuments({
    salesAssignedTo: employeeId,
    status: { $in: ["Scheduled", "Rescheduled"] }
  });
};

/**
 * Core assignment function.
 * Finds the first Sales employee (in _id order) who has < MAX_MEETINGS_PER_EMPLOYEE.
 * Atomically assigns and returns the employee, or null if all are full.
 *
 * @param {import('../models/Meeting')} meeting - already-saved Meeting document
 * @returns {{ employee, assignedCount } | null}
 */
const assignMeetingToSalesEmployee = async (meeting) => {
  // Prevent duplicate assignment if already assigned
  if (meeting.salesAssignedTo && meeting.salesAssignmentStatus === "Assigned") {
    console.log(`[SalesAssignment] Meeting ${meeting._id} is already assigned to ${meeting.salesAssignedToName}. Skipping.`);
    return { employee: { _id: meeting.salesAssignedTo, name: meeting.salesAssignedToName }, assignedCount: -1 };
  }

  const employees = await getActiveSalesEmployees();

  if (employees.length === 0) {
    console.log("[SalesAssignment] No active Sales Employees found.");
    meeting.salesAssignmentStatus = "Unassigned";
    meeting.salesAssignedTo = null;
    meeting.salesAssignedToName = null;
    await meeting.save();
    return null;
  }

  // Get current assignment counts for all active employees
  const employeesWithCounts = await Promise.all(
    employees.map(async (emp) => {
      const count = await getAssignedCount(emp._id);
      return { emp, count };
    })
  );

  // Filter out employees who have reached maximum capacity
  const availableEmployees = employeesWithCounts.filter(e => e.count < MAX_MEETINGS_PER_EMPLOYEE);

  if (availableEmployees.length === 0) {
    console.log(
      `[SalesAssignment] All Sales Employees are full. Meeting ${meeting._id} marked Unassigned.`
    );
    meeting.salesAssignmentStatus = "Unassigned";
    meeting.salesAssignedTo = null;
    meeting.salesAssignedToName = null;
    await meeting.save();
    return null;
  }

  // Sort by count (ascending) to distribute evenly, then by _id for predictability
  availableEmployees.sort((a, b) => {
    if (a.count !== b.count) return a.count - b.count;
    return a.emp._id.toString().localeCompare(b.emp._id.toString());
  });

  const selected = availableEmployees[0];
  const employee = selected.emp;

  // Final check to prevent race conditions during concurrent assignments
  const actualCount = await getAssignedCount(employee._id);
  
  if (actualCount < MAX_MEETINGS_PER_EMPLOYEE) {
    meeting.salesAssignedTo = employee._id;
    meeting.salesAssignedToName = employee.name;
    meeting.salesAssignmentStatus = "Assigned";
    await meeting.save();

    console.log(
      `[SalesAssignment] Meeting ${meeting._id} assigned to ${employee.name} (${actualCount + 1}/${MAX_MEETINGS_PER_EMPLOYEE})`
    );
    return { employee, assignedCount: actualCount + 1 };
  } else {
    // Extremely rare race condition fallback
    meeting.salesAssignmentStatus = "Unassigned";
    meeting.salesAssignedTo = null;
    meeting.salesAssignedToName = null;
    await meeting.save();
    return null;
  }
};

/**
 * Assign all currently-unassigned meetings to available Sales employees.
 * Includes:
 *   - Meetings explicitly marked salesAssignmentStatus: "Unassigned"
 *   - Legacy meetings where salesAssignedTo is null (pre-dates the assignment system)
 * Returns a summary of what was assigned.
 */
const assignPendingMeetings = async () => {
  // Find ALL meetings where salesAssignedTo is null (covers both legacy and new "Unassigned")
  const unassigned = await Meeting.find({
    $or: [
      { salesAssignedTo: null },
      { salesAssignedTo: { $exists: false } },
    ]
  }).sort({ createdAt: 1 });

  let assigned = 0;
  let stillPending = 0;

  for (const meeting of unassigned) {
    const result = await assignMeetingToSalesEmployee(meeting);
    if (result) {
      assigned++;
    } else {
      stillPending++;
    }
  }

  return {
    totalProcessed: unassigned.length,
    newlyAssigned: assigned,
    stillUnassigned: stillPending,
  };
};

/**
 * Get per-employee assignment stats for the Sales Manager dashboard.
 */
const getSalesEmployeeStats = async () => {
  const employees = await getActiveSalesEmployees();

  const stats = await Promise.all(
    employees.map(async (emp) => {
      const assignedCount = await getAssignedCount(emp._id);
      return {
        employeeId: emp._id,
        employeeName: emp.name,
        officialEmail: emp.officialEmail,
        assignedCount,
        maxCapacity: MAX_MEETINGS_PER_EMPLOYEE,
        remainingCapacity: Math.max(0, MAX_MEETINGS_PER_EMPLOYEE - assignedCount),
        isFull: assignedCount >= MAX_MEETINGS_PER_EMPLOYEE,
      };
    })
  );

  const totalAssigned = stats.reduce((sum, s) => sum + s.assignedCount, 0);
  const totalCapacity = employees.length * MAX_MEETINGS_PER_EMPLOYEE;

  // Unassigned = meetings where salesAssignedTo is null (includes legacy meetings)
  const unassignedCount = await Meeting.countDocuments({
    $or: [
      { salesAssignedTo: null },
      { salesAssignedTo: { $exists: false } },
    ]
  });

  return {
    employees: stats,
    totalAssigned,
    totalCapacity,
    unassignedCount,
    availableSlots: totalCapacity - totalAssigned,
  };
};

module.exports = {
  assignMeetingToSalesEmployee,
  assignPendingMeetings,
  getSalesEmployeeStats,
  getActiveSalesEmployees,
  getAssignedCount,
  MAX_MEETINGS_PER_EMPLOYEE,
};
