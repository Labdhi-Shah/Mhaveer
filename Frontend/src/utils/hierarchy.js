import api from "../api";

let cachedEmployees = null;
let cachedPromise = null;

export const normalizeDepartment = (value) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  const lower = raw.toLowerCase();

  // Explicit Panel Mapping
  if (lower.includes("kyc") || lower.includes("compliance")) return "Sales";
  if (lower.includes("admin")) return "Admin";
  if (lower.includes("sales")) return "Sales";
  if (lower.includes("telecall") || lower.includes("tele caller") || lower.includes("lead generation")) return "Telecalling";
  if (lower.includes("lead")) return "Leads";
  if (lower.includes("credit") || lower.includes("underwriting")) return "Credit";

  return raw;
};

export const normalizeRole = (value) => {
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

export const getUserDepartment = (user) => {
  if (!user) return "";
  if (user.department) return normalizeDepartment(user.department);
  if (user.dept) return normalizeDepartment(user.dept);
  if (user.departmentName) return normalizeDepartment(user.departmentName);
  const roleText = typeof user.role === "string" ? user.role : "";
  if (roleText.toLowerCase().includes("sales")) return "Sales";
  if (roleText.toLowerCase().includes("telecall") || roleText.toLowerCase().includes("tele caller") || roleText.toLowerCase().includes("lead generation")) return "Telecalling";
  if (roleText.toLowerCase().includes("lead")) return "Leads";
  if (roleText.toLowerCase().includes("credit") || roleText.toLowerCase().includes("underwriting")) return "Credit";
  if (roleText.toLowerCase().includes("admin")) return "Admin";
  return "";
};

export const getUserRole = (user) => {
  if (!user) return "";
  const value = user.role || user.userRole || user.position || "";
  return normalizeRole(value);
};

export const getDepartmentRoute = (user) => {
  if (!user) return "/login";

  const department = normalizeDepartment(getUserDepartment(user));
  const role = normalizeRole(getUserRole(user));

  if (department === "Admin" || role === "Admin") return "/telecalling/manager";
  if (department === "Sales") {
    if (role === "Manager") return "/sales/manager";
    if (role === "Team Leader") return "/sales/team-leader";
    return "/sales/employee";
  }
  if (department === "Telecalling") {
    if (role === "Manager") return "/telecalling/manager";
    if (role === "Team Leader") return "/telecalling/team-leader";
    return "/telecalling/employee";
  }
  if (department === "Leads") {
    if (role === "Manager") return "/leads/manager";
    if (role === "Team Leader") return "/leads/team-leader";
    return "/leads/employee";
  }
  if (department === "Credit") {
    if (role === "Manager") return "/credit/manager";
    if (role === "Team Leader") return "/credit/team-leader";
    return "/credit/employee";
  }

  if (role === "Manager") return "/telecalling/manager";
  if (role === "Team Leader") return "/telecalling/team-leader";
  return "/telecalling/employee";
};

export const resolveDepartmentDashboard = (department, role) => {
  const normalizedDepartment = normalizeDepartment(department);
  const normalizedRole = normalizeRole(role);

  if (normalizedDepartment === "Admin" || normalizedRole === "Admin") {
    return "telecalling-manager";
  }

  if (normalizedDepartment === "Sales") {
    if (normalizedRole === "Manager") return "sales-manager";
    if (normalizedRole === "Team Leader") return "sales-team-leader";
    return "sales-employee";
  }

  if (normalizedDepartment === "Telecalling") {
    if (normalizedRole === "Manager") return "telecalling-manager";
    if (normalizedRole === "Team Leader") return "telecalling-team-leader";
    return "telecalling-employee";
  }

  if (normalizedDepartment === "Leads") {
    if (normalizedRole === "Manager") return "leads-manager";
    if (normalizedRole === "Team Leader") return "leads-team-leader";
    return "leads-employee";
  }

  if (normalizedDepartment === "Credit") {
    if (normalizedRole === "Manager") return "credit-manager";
    if (normalizedRole === "Team Leader") return "credit-team-leader";
    return "credit-employee";
  }

  if (normalizedRole === "Manager") return "telecalling-manager";
  if (normalizedRole === "Team Leader") return "telecalling-team-leader";
  return "telecalling-employee";
};

export const clearHierarchyCache = () => {
  cachedEmployees = null;
  cachedPromise = null;
};

export const fetchAllEmployees = async () => {
  if (cachedEmployees) return cachedEmployees;
  if (cachedPromise) return cachedPromise;

  cachedPromise = api.get("/employees?limit=1000")
    .then(res => {
      if (res.data.success) {
        cachedEmployees = res.data.data;
        return cachedEmployees;
      }
      return [];
    })
    .catch(err => {
      console.error("Failed to fetch employees for hierarchy:", err);
      return [];
    });

  return cachedPromise;
};

export const getUserRoleCategory = (user) => {
  const role = normalizeRole(getUserRole(user));
  if (role === "Admin") return "Admin";
  if (role === "Manager") return "Manager";
  if (role === "Team Leader") return "Team Leader";
  return "Employee";
};

export const getMergedLeadsAndStats = async (user, ownLeads, ownStats) => {
  return { leads: ownLeads, stats: ownStats };
};

export const filterAttendanceRecords = async (user, allRecords) => {
  return allRecords;
};