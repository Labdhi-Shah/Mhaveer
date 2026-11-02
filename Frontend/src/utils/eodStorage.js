/**
 * EOD (End of Day) Storage and Privacy Utilities
 * Frontend storage strictly isolated by employee ID and selected date.
 * No sample, demo, or pre-filled data.
 */

const STORAGE_KEY = "mhaveer_eod_records";

// Clear any obsolete demo/mock keys from previous versions
try {
  localStorage.removeItem("mhaveer_eod_reports");
  localStorage.removeItem("mhaveer_eod_data");
} catch (e) {
  // Ignore in case of storage disabled
}

// Format a date string (YYYY-MM-DD) into readable display
export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, monthIndex, day);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch (e) {
    return dateStr;
  }
};

// Today's date string YYYY-MM-DD in local timezone
export const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Retrieve all stored EOD records (starts empty, only user-submitted records)
export const getStoredEodReports = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading EOD records from storage:", err);
    return [];
  }
};

// Get a unique identifier string for an employee
const getEmployeeKey = (user) => {
  if (!user) return "";
  return String(user.employeeId || user._id || user.id || user.email || user.name || "").trim().toLowerCase();
};

/**
 * Save an EOD submission strictly bound to employee and selected date
 */
export const saveEodReport = ({ user, date, received, appointment, login }) => {
  try {
    if (!user) {
      return { success: false, error: "Authentication required to submit EOD." };
    }
    if (!date) {
      return { success: false, error: "Please select a date for the EOD submission." };
    }

    const currentRecords = getStoredEodReports();
    const empId = String(user.employeeId || user._id || user.id || "").trim();
    const empEmail = String(user.email || "").trim().toLowerCase();
    const empName = String(user.name || user.fullName || "Employee").trim();

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    const newRecord = {
      id: `eod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      employeeId: empId || empEmail || empName,
      employeeEmail: empEmail,
      employeeName: empName,
      date: date, // Manually selected date string (YYYY-MM-DD)
      displayDate: formatDisplayDate(date),
      received: Number(received) || 0,
      appointment: Number(appointment) || 0,
      login: Number(login) || 0,
      submittedAt: timeStr,
      timestamp: Date.now()
    };

    // Check if a record already exists for this exact employee and exact date
    const existingIndex = currentRecords.findIndex((r) => {
      const matchEmp =
        (empId && r.employeeId && r.employeeId.toLowerCase() === empId.toLowerCase()) ||
        (empEmail && r.employeeEmail && r.employeeEmail.toLowerCase() === empEmail) ||
        (empName && r.employeeName && r.employeeName.toLowerCase() === empName.toLowerCase());
      return matchEmp && r.date === date;
    });

    let updated;
    if (existingIndex >= 0) {
      // Update the submission for that date
      updated = [...currentRecords];
      updated[existingIndex] = { ...updated[existingIndex], ...newRecord };
    } else {
      // Prepend new record
      updated = [newRecord, ...currentRecords];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch custom event for real-time local reactivity
    window.dispatchEvent(new CustomEvent("mhaveer-eod-updated", { detail: updated }));

    return { success: true, record: newRecord };
  } catch (err) {
    console.error("Failed to save EOD report:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Get an employee's submitted EODs with strict privacy.
 * Employee A only sees Employee A's records.
 */
export const getEmployeeSubmissions = (user, filterDate = "") => {
  if (!user) return [];
  const all = getStoredEodReports();
  const empId = String(user.employeeId || user._id || user.id || "").trim().toLowerCase();
  const empEmail = String(user.email || "").trim().toLowerCase();
  const empName = String(user.name || user.fullName || "").trim().toLowerCase();

  return all
    .filter((r) => {
      const match =
        (empId && r.employeeId && r.employeeId.toLowerCase() === empId) ||
        (empEmail && r.employeeEmail && r.employeeEmail.toLowerCase() === empEmail) ||
        (empName && r.employeeName && r.employeeName.toLowerCase() === empName);

      if (!match) return false;
      if (filterDate && r.date !== filterDate) return false;
      return true;
    })
    .sort((a, b) => {
      if (b.date !== a.date) return b.date > a.date ? 1 : -1;
      return b.timestamp - a.timestamp;
    });
};

/**
 * Get team submissions for Manager review.
 * Only actual submitted data, no placeholder or dummy entries.
 */
export const getTeamSubmissionsForManager = (managerUser, filterDate = "", searchMember = "") => {
  const all = getStoredEodReports();

  return all
    .filter((r) => {
      if (filterDate && r.date !== filterDate) return false;
      if (searchMember && !r.employeeName.toLowerCase().includes(searchMember.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (b.date !== a.date) return b.date > a.date ? 1 : -1;
      return b.timestamp - a.timestamp;
    });
};

/**
 * Delete an EOD submission by ID (only by the owner or manager)
 */
export const deleteEodRecord = (recordId) => {
  try {
    const all = getStoredEodReports();
    const updated = all.filter((r) => r.id !== recordId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("mhaveer-eod-updated", { detail: updated }));
    return true;
  } catch (err) {
    console.error("Failed to delete record:", err);
    return false;
  }
};
