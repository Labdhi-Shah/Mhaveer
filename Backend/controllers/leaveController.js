const Leave = require("../models/Leave");
const Employee = require("../models/Employee");

// Apply for leave
exports.applyLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    const employeeId = req.user.id;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const newLeave = new Leave({
      employeeId,
      employeeName: employee.name,
      managerId: employee.managerId || "",
      startDate,
      endDate,
      reason,
      status: "Pending",
    });

    await newLeave.save();

    return res.status(201).json({ success: true, message: "Leave applied successfully", data: newLeave });
  } catch (error) {
    console.error("Apply Leave Error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get employee's own leaves
exports.getMyLeaves = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const leaves = await Leave.find({ employeeId }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    console.error("Get My Leaves Error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Manager/Admin views leaves
exports.getManagerLeaves = async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "SuperAdmin" && req.user.role !== "Manager") {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    let query = {};
    if (req.user.role === "Manager") {
      query.managerId = req.user.id;
    }

    const leaves = await Leave.find(query).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    console.error("Get Manager Leaves Error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update leave status (Approve/Reject)
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    if (req.user.role === "Manager" && leave.managerId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this leave" });
    } else if (req.user.role !== "Admin" && req.user.role !== "SuperAdmin" && req.user.role !== "Manager") {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    leave.status = status;
    await leave.save();

    return res.status(200).json({ success: true, message: `Leave ${status.toLowerCase()} successfully`, data: leave });
  } catch (error) {
    console.error("Update Leave Status Error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
