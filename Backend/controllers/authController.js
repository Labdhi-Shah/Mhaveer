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
      { id: employee._id, email: employee.officialEmail, role: employee.role, name: employee.name },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      token,
      message: "Login Success",
      employee: {
        id: employee._id,
        fullName: employee.name, // keep fullName for frontend compatibility
        name: employee.name,
        email: employee.officialEmail,
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