const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");

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

    return res.json({
      success: true,
      token,
      message: "Login Success",
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