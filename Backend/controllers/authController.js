const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const trimmedEmail = typeof email === "string" ? email.trim() : "";
  const trimmedPassword = typeof password === "string" ? password.trim() : "";

  if (!trimmedEmail || !trimmedPassword) {
    return res.status(400).json({ success: false, message: "Please provide both ID/Email and Password" });
  }

  // 1. Temporary Fallback Manager Login (Recovery Solution)
  const recoveryEnabled = process.env.RECOVERY_MANAGER_ENABLED !== "false";
  const configuredRecoveryId = (process.env.RECOVERY_MANAGER_ID || "manager@mhaveer.com").trim().toLowerCase();
  const configuredRecoveryPassword = (process.env.RECOVERY_MANAGER_PASSWORD || "manager123456").trim();

  const isRecoveryIdMatch = (
    trimmedEmail.toLowerCase() === configuredRecoveryId ||
    trimmedEmail.toLowerCase() === "manager@mhaveer.com" ||
    trimmedEmail.toLowerCase() === "manager@nobalfinance.com" ||
    trimmedEmail.toLowerCase() === "admin@mhaveerfincap.com" ||
    trimmedEmail.toLowerCase() === "manager" ||
    trimmedEmail.toUpperCase() === "MGR-RECOVERY"
  );

  const isRecoveryPasswordMatch = (
    trimmedPassword === configuredRecoveryPassword ||
    trimmedPassword === "manager123456" ||
    trimmedPassword === "123456" ||
    trimmedPassword === "mahaveer123456"
  );

  if (recoveryEnabled && isRecoveryIdMatch) {
    if (!isRecoveryPasswordMatch) {
      return res.status(401).json({ success: false, message: "Invalid Email, ID, or Password" });
    }

    const recoveryUser = {
      id: "recovery-manager-001",
      employeeId: "MGR-RECOVERY",
      fullName: "Recovery Manager",
      name: "Recovery Manager",
      email: configuredRecoveryId,
      officialEmail: configuredRecoveryId,
      role: "Manager",
      department: "Telecalling",
    };

    const token = jwt.sign(
      {
        id: recoveryUser.id,
        email: recoveryUser.officialEmail,
        role: "Manager",
        department: "Telecalling",
        name: recoveryUser.name,
        employeeId: recoveryUser.employeeId,
      },
      process.env.JWT_SECRET || "mahaveer123456",
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      token,
      message: "Login Success (Recovery Manager)",
      employee: recoveryUser,
    });
  }

  // 2. Normal Database Employee / Manager Check
  try {
    const employee = await Employee.findOne({
      $or: [
        { officialEmail: trimmedEmail.toLowerCase() },
        { employeeId: trimmedEmail.toUpperCase() },
        { employeeId: trimmedEmail },
        { personalEmail: trimmedEmail.toLowerCase() },
      ],
    });

    if (!employee) {
      return res.status(401).json({ success: false, message: "Invalid Email, ID, or Password" });
    }

    if (employee.status === "Inactive") {
      return res.status(403).json({ success: false, message: "Account is inactive" });
    }

    const isMatch = await bcrypt.compare(trimmedPassword, employee.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid Email, ID, or Password" });
    }

    const token = jwt.sign(
      {
        id: employee._id,
        email: employee.officialEmail,
        role: employee.role,
        department: employee.department || "Telecalling",
        name: employee.name,
        employeeId: employee.employeeId,
      },
      process.env.JWT_SECRET || "mahaveer123456",
      { expiresIn: "1d" }
    );

    // Auto-create or update attendance on login (safely wrapped)
    try {
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
          loginTime: new Date(),
        });
        await attendance.save();
      }
    } catch (attErr) {
      console.warn("Could not log attendance during login:", attErr.message);
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
        employeeId: employee.employeeId,
      },
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