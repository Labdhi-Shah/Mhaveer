import api from "../api";

let cachedEmployees = null;
let cachedPromise = null;

export const normalizeDepartment = (value) => {
  return "Telecalling";
};

export const normalizeRole = (value) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "Employee";
  const lower = raw.toLowerCase();
  
  if (
    lower === "superadmin" || 
    lower === "administration (admin)" || 
    lower === "admin" ||
    lower === "management" || 
    lower === "branch manager" || 
    lower === "operations manager" || 
    lower === "regional manager" || 
    lower.includes("director") || 
    lower.includes("ceo") ||
    lower === "manager"
  ) {
    return "Manager";
  }
  
  return "Employee";
};

export const getUserDepartment = (user) => {
  return "Telecalling";
};

export const getUserRole = (user) => {
  if (!user) return "";
  const value = user.role || user.userRole || user.position || "";
  return normalizeRole(value);
};

export const getDepartmentRoute = (user) => {
  if (!user) return "/login";
  const role = normalizeRole(getUserRole(user));
  if (role === "Manager") return "/telecalling/manager";
  return "/telecalling/employee";
};

export const resolveDepartmentDashboard = (department, role) => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "Manager") return "telecalling-manager";
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
  return normalizeRole(getUserRole(user));
};

export const getMergedLeadsAndStats = async (user, ownLeads, ownStats) => {
  return { leads: ownLeads, stats: ownStats };
};

export const filterAttendanceRecords = async (user, allRecords) => {
  return allRecords;
};