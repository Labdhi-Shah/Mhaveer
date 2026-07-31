import api from "../api";

let cachedEmployees = null;
let cachedPromise = null;

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
  if (!user) return "Employee";
  const roleStr = typeof user === "string" ? user : (user.role || "");
  const role = roleStr.toLowerCase();
  if (role === "superadmin" || role === "admin") return "Admin";
  if (
    role === "manager" ||
    role === "branch manager" ||
    role === "operations manager" ||
    role === "regional manager" ||
    role === "director / ceo" ||
    role === "management"
  ) {
    return "Manager";
  }
  if (role === "team leader" || role === "tl" || role === "teamleader") {
    return "Team Leader";
  }
  return "Employee";
};

export const getMergedLeadsAndStats = async (user, ownLeads, ownStats) => {
  return { leads: ownLeads, stats: ownStats };
};

export const filterAttendanceRecords = async (user, allRecords) => {
  return allRecords;
};
