const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");

// Helper to extract real client IP across direct connections, local network, and reverse proxies (e.g. Render)
const getClientIp = (req) => {
  let ip = "";
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    ip = forwarded.split(",")[0].trim();
  } else {
    ip = req.socket?.remoteAddress || req.ip || "";
  }
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }
  return ip;
};

// Helper to check if the detected IP matches allowed office IP addresses
const isAllowedOfficeIp = (clientIp) => {
  if (!clientIp) return false;

  // Always allow local development and testing
  if (clientIp === "127.0.0.1" || clientIp === "::1" || clientIp === "localhost") {
    return true;
  }

  const rawAllowed = process.env.ALLOWED_OFFICE_IPS || "103.86.19.253,2402:a00:403:3847";
  const allowedList = rawAllowed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return allowedList.some((allowed) => {
    return clientIp === allowed || clientIp.startsWith(allowed);
  });
};

// Roles exempt from IP restriction (Option A: Admins and Managers can log in from anywhere)
const isExemptFromIpRestriction = (role) => {
  if (!role) return false;
  const normalized = role.toLowerCase().trim();
  const exemptRoles = [
    "superadmin",
    "admin",
    "administration (admin)",
    "manager",
    "management",
    "branch manager",
    "regional manager",
    "director / ceo",
  ];
  return exemptRoles.includes(normalized);
};

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

    // 3. Office IP Restriction Check (Option A: Regular employees restricted to office Wi-Fi)
    const ipRestrictionEnabled = process.env.ENABLE_IP_RESTRICTION === "true";
    if (ipRestrictionEnabled && !isExemptFromIpRestriction(employee.role)) {
      const clientIp = getClientIp(req);
      if (!isAllowedOfficeIp(clientIp)) {
        console.warn(
          `⚠️ [IP RESTRICTION BLOCKED] Employee: ${employee.employeeId} (${employee.name}, Role: ${employee.role}) tried logging in from unauthorized IP: ${clientIp}`
        );
        return res.status(403).json({
          success: false,
          message: "Access Denied: Logins are only permitted from the office Wi-Fi network.",
        });
      }
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
