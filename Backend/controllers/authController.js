const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Admin Check
  if (email === "admin@mhaveerfincap.com" && password === "123456") {
    const token = jwt.sign(
      { id: "admin-123", email, role: "Admin", name: "Super Admin", department: "Admin" },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "1d" }
    );
    return res.json({
      success: true,
      token,
      message: "Login Success",
      employee: {
        id: "admin-123",
        fullName: "Super Admin",
        name: "Super Admin",
        email,
        officialEmail: email,
        role: "Admin",
        department: "Admin"
      }
    });
  }


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

  if (!employeeId || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, message: "Employee ID and both password fields are required" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Passwords do not match" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }

  try {
    const employee = await Employee.findOne({ employeeId: employeeId.trim() });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee ID not found" });
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
  const { attendanceId } = req.body;
  if (!attendanceId) {
    return res.status(400).json({ success: false, message: "Attendance ID required" });
  }

  try {
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    if (attendance.status !== "Completed") {
      // If currently on break, cap the break
      if (attendance.status === "On Break" && attendance.breaks.length > 0) {
        const lastBreak = attendance.breaks[attendance.breaks.length - 1];
        if (!lastBreak.endTime) {
          lastBreak.endTime = new Date();
        }
      }

      attendance.endTime = new Date();
      attendance.status = "Completed";

      // Calculate total break minutes
      let totalBreakMs = 0;
      attendance.breaks.forEach((b) => {
        if (b.startTime && b.endTime) {
          totalBreakMs += (b.endTime - b.startTime);
        }
      });
      const totalBreakMins = Math.floor(totalBreakMs / 60000);
      attendance.totalBreakMinutes = totalBreakMins;

      // Calculate working hours
      let diffMs = 0;
      if (attendance.startTime) {
        diffMs = attendance.endTime - attendance.startTime;
      }
      const totalWorkMins = Math.floor(diffMs / 60000) - totalBreakMins;

      const finalWorkMins = totalWorkMins > 0 ? totalWorkMins : 0;
      const hours = Math.floor(finalWorkMins / 60);
      const minutes = finalWorkMins % 60;

      const pad = (n) => String(n).padStart(2, "0");

      attendance.totalWorkingMinutes = finalWorkMins;
      attendance.totalWorkingHours = `${pad(hours)}:${pad(minutes)}`;
      await attendance.save();
    }

    return res.json({ success: true, message: "Logout tracked successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ success: false, message: "Server error during logout" });
  }
};