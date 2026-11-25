const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");

// Helper to extract and normalize real client IP across direct connections, local network, and reverse proxies
const normalizeIp = (rawIp) => {
  if (!rawIp || typeof rawIp !== "string") return "";
  let clean = rawIp.trim();
  // Strip bracketed IPv6 notation e.g. [2409:40c1:...]:port or [2409:40c1:...]
  if (clean.startsWith("[") && clean.includes("]")) {
    clean = clean.slice(1, clean.indexOf("]"));
  }
  // Strip IPv4-mapped IPv6 prefix (e.g. ::ffff:103.86.19.253)
  if (clean.toLowerCase().startsWith("::ffff:")) {
    clean = clean.slice(7);
  }
  // Strip IPv4 port if present (e.g. 103.86.19.253:49152)
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(clean)) {
    clean = clean.split(":")[0];
  }
  return clean.toLowerCase();
};

const getClientIp = (req) => {
  // 1. Cloudflare Edge header (tamper-proof when traffic routes through Cloudflare)
  let rawIp = req.headers["cf-connecting-ip"];

  // 2. Edge reverse proxy header (Render / Nginx overwrite x-real-ip with client's TCP address)
  if (!rawIp) {
    rawIp = req.headers["x-real-ip"];
  }

  // 3. Reverse proxy X-Forwarded-For
  if (!rawIp) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) {
      rawIp = forwarded.split(",")[0].trim();
    } else if (Array.isArray(forwarded) && forwarded.length > 0) {
      rawIp = String(forwarded[0]).split(",")[0].trim();
    }
  }

  // 4. Fallback to Express req.ip or socket remote address (for direct local development)
  if (!rawIp) {
    rawIp = req.ip || req.socket?.remoteAddress || "";
  }

  return normalizeIp(rawIp);
};

// Helper to check if the detected IP matches allowed office IP addresses
const isAllowedOfficeIp = (clientIp) => {
  if (!clientIp || typeof clientIp !== "string") return false;

  const normalized = normalizeIp(clientIp);
  if (!normalized) return false;

  // Always allow local development and testing on localhost
  if (normalized === "127.0.0.1" || normalized === "::1" || normalized === "localhost") {
    return true;
  }

  const rawAllowed =
    process.env.ALLOWED_OFFICE_IPS ||
    "103.86.19.253,2409:40c1:57:3aba,2402:a00:403:3847";

  const allowedList = rawAllowed
    .split(",")
    .map((item) => normalizeIp(item))
    .filter(Boolean);

  return allowedList.some((allowed) => {
    // Exact match (e.g. IPv4 "103.86.19.253" or full IPv6)
    if (normalized === allowed) {
      return true;
    }

    // IPv6 subnet prefix matching:
    // Requires both to be IPv6 and allowed prefix to have at least 4 segments (/64 prefix)
    // with colon delimiter to prevent matching broad ISP mobile data subnets
    if (allowed.includes(":") && normalized.includes(":")) {
      const allowedSegments = allowed.split(":").filter(Boolean);
      if (allowedSegments.length >= 4) {
        return normalized.startsWith(allowed + ":") || normalized === allowed;
      }
    }

    return false;
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

  // 1. Manager Login
  const managerEmail = (process.env.MANAGER_EMAIL || process.env.RECOVERY_MANAGER_ID || "Pallavi@nobalfinance.com").trim().toLowerCase();
  const managerPassword = (process.env.MANAGER_PASSWORD || process.env.RECOVERY_MANAGER_PASSWORD || "Pallavi@nobalfina").trim();

  if (trimmedEmail.toLowerCase() === managerEmail) {
    if (trimmedPassword !== managerPassword) {
      return res.status(401).json({ success: false, message: "Invalid Email, ID, or Password" });
    }

    const dbManager = await Employee.findOne({
      $or: [
        { officialEmail: managerEmail },
        { role: "Manager" }
      ]
    });

    const managerUser = {
      id: dbManager ? dbManager._id : "6ad9da42cb554888ce71a320",
      employeeId: dbManager?.employeeId || "MGR0001",
      fullName: "Pallavi",
      name: "Pallavi",
      email: managerEmail,
      officialEmail: managerEmail,
      role: "Manager",
      department: dbManager?.department || "Telecalling",
    };

    const token = jwt.sign(
      {
        id: managerUser.id,
        email: managerUser.officialEmail,
        role: "Manager",
        department: managerUser.department,
        name: managerUser.name,
        employeeId: managerUser.employeeId,
      },
      process.env.JWT_SECRET || "mahaveer123456",
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      token,
      message: "Login Success",
      employee: managerUser,
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

    // 3. Office IP Restriction Check (Enforced for Employee Panel login only; Managers and Admins are exempt)
    const ipRestrictionEnabled = process.env.ENABLE_IP_RESTRICTION !== "false";
    const clientIp = getClientIp(req);
    const isExempt = isExemptFromIpRestriction(employee.role);
    const isAllowed = isAllowedOfficeIp(clientIp);

    console.log(
      `[AUTH IP CHECK] User: ${employee.officialEmail} | Role: ${employee.role} | Detected IP: "${clientIp}" | Exempt: ${isExempt} | IP Allowed: ${isAllowed} | Enforced: ${ipRestrictionEnabled}`
    );

    if (ipRestrictionEnabled && !isExempt) {
      if (!isAllowed) {
        console.warn(
          `⚠️ [IP RESTRICTION BLOCKED] Login denied for ${employee.employeeId} (${employee.name}, Role: ${employee.role}) from unauthorized IP: "${clientIp}"`
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

    // Auto-create or reactivate attendance on login (safely wrapped)
    let attendance = null;
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      attendance = await Attendance.findOne({ employeeId: employee._id, date: { $gte: startOfDay } });
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
          date: startOfDay,
          loginTime: new Date(),
          startTime: new Date(),
          status: "Working",
          logoutTime: null,
        });
        await attendance.save();
      } else {
        // If employee is logging in for the second time today after logging out,
        // clear logoutTime so the session is active again
        let needsSave = false;
        if (attendance.logoutTime) {
          attendance.logoutTime = null;
          needsSave = true;
        }
        if (!attendance.status || attendance.status === "Completed") {
          attendance.status = "Working";
          needsSave = true;
        }
        if (needsSave) {
          await attendance.save();
        }
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
        _id: employee._id,
        fullName: employee.name,
        name: employee.name,
        email: employee.officialEmail,
        officialEmail: employee.officialEmail,
        role: employee.role,
        department: employee.department || "",
        employeeId: employee.employeeId,
      },
      loginTime: attendance?.loginTime || new Date(),
      attendanceId: attendance?._id,
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
      return res.status(200).json({ success: true, message: "No active attendance record found for today" });
    }

    attendance.logoutTime = new Date();
    attendance.status = "Completed";
    await attendance.save();

    return res.json({ success: true, message: "Logout tracked successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ success: false, message: "Server error during logout" });
  }
};
