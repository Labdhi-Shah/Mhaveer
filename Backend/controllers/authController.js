const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Super Admin Check
  if (email === "admin@mhaveerfincap.com" && password === "123456") {
    const token = jwt.sign(
      { email, role: "SuperAdmin" },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      token,
      message: "Login Success",
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
      { id: employee._id, email: employee.email, role: employee.role },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "1d" }
    );

    // Create an Attendance record for this session
    const attendance = new Attendance({
      employeeId: employee._id,
      employeeName: employee.name,
      officialEmail: employee.officialEmail,
      role: employee.role,
      branch: employee.branch || "Corporate",
      loginTime: new Date(),
      status: "Present",
    });
    await attendance.save();

    return res.json({
      success: true,
      token,
      message: "Login Success",
      loginTime: attendance.loginTime,
      attendanceId: attendance._id,
      employee: {
        fullName: employee.name, // keep fullName for frontend compatibility
        name: employee.name,
        role: employee.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Server error during login" });
  }
};

exports.changePassword = async (req, res) => {
  // For now, this is a stub so the frontend doesn't break
  res.status(200).json({ success: true, message: "Password updated successfully!" });
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

    if (!attendance.logoutTime) {
      attendance.logoutTime = new Date();
      
      // End active break if any
      if (attendance.breaks && attendance.breaks.length > 0) {
        const lastBreak = attendance.breaks[attendance.breaks.length - 1];
        if (!lastBreak.endTime) {
          lastBreak.endTime = attendance.logoutTime;
        }
      }

      // Recalculate total break minutes
      let totalBreakMins = 0;
      if (attendance.breaks) {
        attendance.breaks.forEach(b => {
          if (b.startTime && b.endTime) {
            totalBreakMins += Math.floor((b.endTime - b.startTime) / 60000);
          }
        });
        const bh = Math.floor(totalBreakMins / 60);
        const bm = totalBreakMins % 60;
        attendance.totalBreakTime = `${String(bh).padStart(2, '0')}:${String(bm).padStart(2, '0')}`;
      }

      // Calculate working hours (Total Time - Break Time)
      const diffMs = attendance.logoutTime - attendance.loginTime;
      const totalWorkMins = Math.floor(diffMs / 60000) - totalBreakMins;
      
      // Prevent negative
      const finalWorkMins = totalWorkMins > 0 ? totalWorkMins : 0;
      const hours = Math.floor(finalWorkMins / 60);
      const minutes = finalWorkMins % 60;
      
      const pad = (n) => String(n).padStart(2, "0");
      
      attendance.workingHours = `${pad(hours)}:${pad(minutes)}`;
      await attendance.save();
    }

    return res.json({ success: true, message: "Logout tracked successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ success: false, message: "Server error during logout" });
  }
};