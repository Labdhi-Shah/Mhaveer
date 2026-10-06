const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");

exports.login = async (req, res) => {
  const { email, password } = req.body;




  // Employee Check
  try {
    const employee = await Employee.findOne({ officialEmail: email });
    if (!employee) {
      return res.status(401).json({ success: false, message: "Invalid Email or Password" });
    }

    if (employee.status === "Inactive") {
      return res.status(403).json({ success: false, message: "Account is inactive" });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid Email or Password" });
    }

    const token = jwt.sign(
      {
        id: employee._id,
        email: employee.officialEmail,
        role: employee.role,
        department: employee.department || "",
        name: employee.name
      },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "1d" }
    );

    // Auto-create or update attendance on login
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    let attendance = await Attendance.findOne({ employeeId: employee._id, date: { $gte: startOfDay } });
    if (!attendance) {
      attendance = new Attendance({
        employeeId: employee._id,
        employeeName: employee.name,
        officialEmail: employee.officialEmail,
        role: employee.role,
        managerId: employee.managerId || "",
        managerName: employee.managerName || "",
        teamLeaderId: employee.teamLeaderId || "",
        teamLeaderName: employee.teamLeaderName || "",
        date: new Date(),
        loginTime: new Date()
      });
      await attendance.save();
    }

    return res.json({
      success: true,
      token,
      message: "Login Success",
      employee: {
        id: employee._id,
        fullName: employee.name,
        name: employee.name,
        email: employee.officialEmail,
        officialEmail: employee.officialEmail,
        role: employee.role,
        department: employee.department || "",
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Server error during login" });
  }
};

exports.changePassword = async (req, res) => {
  const { employeeId, newPassword, confirmPassword } = req.body;
  const accountIdentifier = typeof employeeId === "string" ? employeeId.trim() : "";

  if (!accountIdentifier || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, message: "Employee ID or official email and both password fields are required" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Passwords do not match" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }

  try {
    const employee = await Employee.findOne({
      $or: [
        { employeeId: accountIdentifier.toUpperCase() },
        { officialEmail: accountIdentifier.toLowerCase() },
      ],
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee ID or official email is not found" });
    }

    employee.password = await bcrypt.hash(newPassword, 10);
    await employee.save();

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({ success: false, message: "Server error while updating password" });
  }
};

exports.logout = async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) {
    return res.status(400).json({ success: false, message: "Employee ID required for logout" });
  }

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ 
      employeeId, 
      date: { $gte: startOfDay } 
    });

    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance record not found for today" });
    }

    attendance.logoutTime = new Date();
    await attendance.save();

    return res.json({ success: true, message: "Logout tracked successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ success: false, message: "Server error during logout" });
  }
};