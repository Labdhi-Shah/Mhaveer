const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Customer = require("../models/Customer");
const Employee = require("../models/Employee");

// ── Multer Storage ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
  const allowedExtensions = [".pdf", ".jpeg", ".jpg", ".png"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid format. Only PDF, PNG, JPG, and JPEG are allowed."), false);
  }
};

const uploadBankProof = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
}).single("bankSanctionProof");

// Helper: normalise department string
const normalizeDept = (value) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (lower.includes("kyc") || lower.includes("compliance")) return "Sales";
  if (lower.includes("admin")) return "Admin";
  if (lower.includes("sales")) return "Sales";
  if (lower.includes("telecall") || lower.includes("tele caller") || lower.includes("lead generation")) return "Telecalling";
  if (lower.includes("lead")) return "Leads";
  if (lower.includes("credit") || lower.includes("underwriting")) return "Credit";
  return raw;
};

const normalizeRole = (value) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (lower === "superadmin" || lower === "administration (admin)" || lower === "admin") return "Admin";
  if (lower === "management" || lower === "branch manager" || lower === "operations manager" || lower === "regional manager" || lower.includes("director") || lower.includes("ceo")) return "Manager";
  if (lower === "manager") return "Manager";
  if (lower === "team leader" || lower === "tl" || lower === "teamleader") return "Team Leader";
  if (lower === "employee" || lower === "front desk" || lower === "reception" || lower === "sales department" || lower === "sales" || lower.includes("hr") || lower.includes("support") || lower.includes("marketing") || lower.includes("operations") || lower.includes("legal") || lower.includes("finance") || lower.includes("insurance") || lower.includes("it department")) return "Employee";
  return "Employee";
};

// ──────────────────────────────────────────────────────────────────────────────
// Assignment Logic (Auto assign to a credit employee)
// ──────────────────────────────────────────────────────────────────────────────
exports.assignCreditFileToEmployee = async (customerId) => {
  try {
    // Find all active credit employees
    const creditEmployees = await Employee.find({ 
      status: "Active", 
      $or: [
        { department: { $regex: /credit/i } },
        { department: { $regex: /underwriting/i } }
      ],
      role: { $not: { $regex: /(manager|tl|team leader)/i } } // just regular employees
    });

    if (creditEmployees.length === 0) {
      console.log("No active credit employees found for assignment.");
      // Still set status so it appears in Credit Manager's queue
      await Customer.findByIdAndUpdate(customerId, {
        creditStatus: "New"
      });
      return;
    }

    // Round robin or random. Let's do random for simplicity or based on lowest workload.
    // To do workload: get counts
    let selectedEmployee = creditEmployees[0];
    let minFiles = Infinity;

    for (const emp of creditEmployees) {
      const count = await Customer.countDocuments({ creditAssignedTo: emp._id, creditStatus: { $nin: ["Approved", "Rejected", "Recommended"] } });
      if (count < minFiles) {
        minFiles = count;
        selectedEmployee = emp;
      }
    }

    await Customer.findByIdAndUpdate(customerId, {
      creditAssignedTo: selectedEmployee._id,
      creditAssignedEmployeeId: selectedEmployee.employeeId,
      creditAssignedEmployeeName: selectedEmployee.name,
      creditStatus: "New"
    });

    console.log(`Assigned Customer file ${customerId} to Credit Employee ${selectedEmployee.name}`);
  } catch (error) {
    console.error("Error auto-assigning credit file:", error);
  }
};

exports.assignCreditFiles = async (req, res) => {
  // Manual trigger if needed
  try {
    const userRole = normalizeRole(req.user.role);
    const userDept = normalizeDept(req.user.department);

    if (userDept !== "Credit" || userRole !== "Manager") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const unassignedFiles = await Customer.find({
      status: "Completed", // completed by sales
      creditAssignedTo: null
    });

    for (const file of unassignedFiles) {
      await exports.assignCreditFileToEmployee(file._id);
    }

    res.status(200).json({ success: true, message: "Assignment completed" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Get Credit Files
// ──────────────────────────────────────────────────────────────────────────────
exports.getCreditFiles = async (req, res) => {
  try {
    const userRole = normalizeRole(req.user.role);
    const userDept = normalizeDept(req.user.department);
    const userId = req.user.id;

    if (userDept !== "Credit" && userRole !== "Admin") {
      return res.status(403).json({ success: false, message: "Unauthorized to view credit files" });
    }

    let query = { $or: [{ creditStatus: { $ne: null } }, { status: "Pending Verification" }, { status: "Completed" }] };
    
    if (userRole === "Manager" || userRole === "Admin") {
      // Manager sees all credit files
    } else if (userRole === "Team Leader") {
      // TL sees files assigned to their team (simplify: same as manager or just their own + team if tracked)
      // For now, allow TL to see all or implement team logic if exists.
      // If no team logic, they might only see assigned to them.
      query.creditAssignedTo = userId;
    } else {
      // Employee sees only their assigned files
      query.creditAssignedTo = userId;
    }

    const files = await Customer.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: files });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.getCreditFileById = async (req, res) => {
  try {
    const file = await Customer.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: "File not found" });

    // Authorization
    const userRole = normalizeRole(req.user.role);
    const userDept = normalizeDept(req.user.department);
    const userId = req.user.id;

    if (userDept !== "Credit" && userRole !== "Admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (userRole === "Employee" && file.creditAssignedTo?.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not assigned to this file" });
    }

    res.status(200).json({ success: true, data: file });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Update Document Verification
// ──────────────────────────────────────────────────────────────────────────────
exports.updateDocumentVerification = async (req, res) => {
  try {
    const { docType, status, remark } = req.body;
    const file = await Customer.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: "File not found" });

    if (!file.documentVerification) {
      file.documentVerification = new Map();
    }

    file.documentVerification.set(docType, { status, remark });
    await file.save();

    res.status(200).json({ success: true, data: file });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Update Credit Details
// ──────────────────────────────────────────────────────────────────────────────
exports.updateCreditDetails = async (req, res) => {
  try {
    const { cibilScore, creditDetails, creditRemarks, status } = req.body;
    const file = await Customer.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: "File not found" });

    if (cibilScore !== undefined) file.cibilScore = cibilScore;
    if (creditDetails) file.creditDetails = { ...file.creditDetails, ...creditDetails };
    if (creditRemarks !== undefined) file.creditRemarks = creditRemarks;
    if (status) file.creditStatus = status;

    await file.save();

    res.status(200).json({ success: true, data: file });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Submit Credit Decision
// ──────────────────────────────────────────────────────────────────────────────
exports.submitCreditDecision = async (req, res) => {
  try {
    const { decision, remarks } = req.body;
    const file = await Customer.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: "File not found" });

    const userRole = normalizeRole(req.user.role);

    if (userRole === "Employee") {
      file.creditStatus = "Credit Review Completed"; // Sent to manager
    } else if (userRole === "Manager" || userRole === "Admin") {
      file.creditStatus = decision; // "Approved", "Rejected", "Recommended"
    }

    if (remarks) file.creditRemarks = remarks;
    file.creditReviewedBy = req.user.id;
    file.creditReviewedAt = new Date();

    await file.save();

    res.status(200).json({ success: true, data: file });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Dashboard Stats
// ──────────────────────────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const userRole = normalizeRole(req.user.role);
    const userId = req.user.id;
    
    console.log("getDashboardStats HIT =>", { reqUserRole: req.user.role, normalizedRole: userRole, userId });

    let query = { $or: [{ creditStatus: { $ne: null } }, { status: "Pending Verification" }, { status: "Completed" }] };
    if (userRole === "Employee" || userRole === "Team Leader") {
      query.creditAssignedTo = userId;
    }
    
    console.log("getDashboardStats query:", JSON.stringify(query));

    const newFiles = await Customer.countDocuments({ $and: [query, { creditStatus: { $in: ["New", "Pending Credit Review", null] } }] });
    const pendingVer = await Customer.countDocuments({ $and: [query, { creditStatus: "Under Verification" }] });
    const docsPending = await Customer.countDocuments({ $and: [query, { creditStatus: "Documents Pending" }] });
    const completedRev = await Customer.countDocuments({ $and: [query, { creditStatus: "Credit Review Completed" }] });
    const rejected = await Customer.countDocuments({ $and: [query, { creditStatus: { $in: ["Rejected", "Bank Rejected"] } }] });
    const approved = await Customer.countDocuments({ $and: [query, { creditStatus: { $in: ["Approved", "Bank Approved"] } }] });
    const totalAssigned = await Customer.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        newFiles,
        pendingVer,
        docsPending,
        completedRev,
        rejected,
        approved,
        totalAssigned
      }
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Submit Bank Application
// ──────────────────────────────────────────────────────────────────────────────
exports.submitBankApplication = async (req, res) => {
  uploadBankProof(req, res, async (err) => {
    if (err) {
      console.error("Bank Proof Upload Error:", err);
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const { bankApplied, bankApplicationStatus, bankSanctionedAmount } = req.body;
      const file = await Customer.findById(req.params.id);
      
      if (!file) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({ success: false, message: "File not found" });
      }

      if (bankApplied) file.bankApplied = bankApplied;
      if (bankApplicationStatus) {
        file.bankApplicationStatus = bankApplicationStatus;
        if (bankApplicationStatus === "Approved") {
          file.creditStatus = "Bank Approved";
        } else if (bankApplicationStatus === "Rejected") {
          file.creditStatus = "Bank Rejected";
        } else if (bankApplicationStatus === "Pending") {
          file.creditStatus = "Bank Pending";
        }
      }
      if (bankSanctionedAmount) file.bankSanctionedAmount = Number(bankSanctionedAmount);

      if (req.file) {
        file.bankSanctionProof = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          mimeType: req.file.mimetype,
          size: req.file.size
        };
      }

      await file.save();
      res.status(200).json({ success: true, data: file });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// OTP For Bank Links
// ──────────────────────────────────────────────────────────────────────────────
exports.sendBankOtp = async (req, res) => {
  try {
    const file = await Customer.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: "File not found" });

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    file.bankOtp = otp;
    file.bankOtpExpiry = expiry;
    await file.save();

    console.log(`[OTP GENERATED] Send this to customer ${file.fullName} (${file.phone}): ${otp}`);

    res.status(200).json({ 
      success: true, 
      message: "OTP sent successfully (check console/whatsapp)",
      customerPhone: file.phone,
      otp: otp
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.verifyBankOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const file = await Customer.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: "File not found" });

    if (!file.bankOtp || file.bankOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (new Date() > file.bankOtpExpiry) {
      return res.status(400).json({ success: false, message: "OTP Expired" });
    }

    // Success
    file.bankLinksUnlocked = true;
    file.bankOtp = null;
    file.bankOtpExpiry = null;
    await file.save();

    res.status(200).json({ success: true, message: "OTP verified successfully, bank links unlocked." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.unlockBanks = async (req, res) => {
  try {
    const file = await Customer.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: "File not found" });

    // Directly unlock banks without OTP
    file.bankLinksUnlocked = true;
    file.bankOtp = null;
    file.bankOtpExpiry = null;
    await file.save();

    res.status(200).json({ success: true, message: "Bank links unlocked successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
