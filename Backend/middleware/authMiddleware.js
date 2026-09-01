const jwt = require("jsonwebtoken");

const normalizeDepartment = (value) => {
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

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ success: false, message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey");
    req.user = decoded;
    req.user.department = normalizeDepartment(decoded.department || decoded.dept || "");
    req.user.role = normalizeRole(decoded.role || decoded.userRole || "");
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Token is not valid" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized: No user credentials" });
    }
    const userRole = req.user.role ? req.user.role.toLowerCase() : "";
    const isAuthorized = roles.some(role => {
      const targetRole = role.toLowerCase();
      if (userRole === targetRole) return true;
      if (targetRole === 'admin' && (userRole === 'administration (admin)' || userRole === 'superadmin' || userRole === 'admin')) return true;
      if (targetRole === 'hr' && (userRole === 'human resources (hr)' || userRole === 'hr')) return true;
      if (targetRole === 'sales' && (userRole === 'sales department' || userRole === 'sales')) return true;
      if (targetRole === 'team leader' && (userRole === 'team leader' || userRole === 'tl' || userRole === 'teamleader')) return true;
      return userRole.includes(targetRole) || targetRole.includes(userRole);
    });

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Access Denied: You do not have permission to access this resource" });
    }
    next();
  };
};

const authorizeDepartmentRole = ({ departments = [], roles = [] } = {}) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized: No user credentials" });
    }

    const userDepartment = normalizeDepartment(req.user.department || req.user.dept || "");
    const userRole = normalizeRole(req.user.role || "");

    const departmentAllowed = departments.length === 0 || departments.includes(userDepartment);
    const roleAllowed = roles.length === 0 || roles.includes(userRole);

    if (!departmentAllowed || !roleAllowed) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Department and role do not match this resource"
      });
    }

    next();
  };
};

module.exports = authMiddleware;
authMiddleware.authorize = authorize;
authMiddleware.authorizeDepartmentRole = authorizeDepartmentRole;
