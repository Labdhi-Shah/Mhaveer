/**
 * EOD (End of Day) Storage and State Utilities
 * Frontend-only mock storage using localStorage with sample team data
 */

const STORAGE_KEY = "mhaveer_eod_reports";

// Format 0 as "00", 5 as "05", 106 as "106"
export const formatCount = (val) => {
  if (val === undefined || val === null || val === "") return "00";
  const num = parseInt(val, 10);
  if (isNaN(num)) return "00";
  return num < 10 && num >= 0 ? `0${num}` : `${num}`;
};

// Generate today's date string YYYY-MM-DD in local time
export const getTodayDateKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Get yesterday's date string YYYY-MM-DD
export const getYesterdayDateKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Format a date string into readable display
export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
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

// Initial default mock data matching the WhatsApp reference screenshot provided
const getInitialMockReports = () => {
  const todayKey = getTodayDateKey();
  const yesterdayKey = getYesterdayDateKey();

  return [
    {
      id: "eod-mock-1",
      employeeName: "Shruti",
      employeeId: "EMP-SHRUTI",
      date: todayKey,
      displayDate: formatDisplayDate(todayKey),
      received: 106,
      appointment: 0,
      login: 0,
      submittedAt: "06:45 PM",
      status: "Submitted",
      notes: "Daily calling targets achieved."
    },
    {
      id: "eod-mock-2",
      employeeName: "Priya Sharma",
      employeeId: "EMP-PRIYA",
      date: todayKey,
      displayDate: formatDisplayDate(todayKey),
      received: 88,
      appointment: 4,
      login: 2,
      submittedAt: "06:30 PM",
      status: "Submitted",
      notes: "Followed up with home loan inquiries."
    },
    {
      id: "eod-mock-3",
      employeeName: "Amit Patel",
      employeeId: "EMP-AMIT",
      date: todayKey,
      displayDate: formatDisplayDate(todayKey),
      received: 112,
      appointment: 6,
      login: 3,
      submittedAt: "07:15 PM",
      status: "Submitted",
      notes: "High appointment conversion today."
    },
    {
      id: "eod-mock-4",
      employeeName: "Neha Gupta",
      employeeId: "EMP-NEHA",
      date: todayKey,
      displayDate: formatDisplayDate(todayKey),
      received: 94,
      appointment: 3,
      login: 1,
      submittedAt: "06:20 PM",
      status: "Submitted",
      notes: "Personal loan leads logged."
    },
    {
      id: "eod-mock-5",
      employeeName: "Rahul Verma",
      employeeId: "EMP-RAHUL",
      date: yesterdayKey,
      displayDate: formatDisplayDate(yesterdayKey),
      received: 75,
      appointment: 2,
      login: 1,
      submittedAt: "07:00 PM",
      status: "Submitted",
      notes: "Business loan document collection pending."
    },
    {
      id: "eod-mock-6",
      employeeName: "Shruti",
      employeeId: "EMP-SHRUTI",
      date: yesterdayKey,
      displayDate: formatDisplayDate(yesterdayKey),
      received: 98,
      appointment: 2,
      login: 1,
      submittedAt: "06:40 PM",
      status: "Submitted",
      notes: "Calling pipeline updated."
    }
  ];
};

// Load all EOD reports from localStorage
export const getStoredEodReports = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialMockReports();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = getInitialMockReports();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch (err) {
    console.error("Error reading EOD reports from localStorage:", err);
    return getInitialMockReports();
  }
};

// Save a new EOD report to localStorage
export const saveEodReport = (reportData) => {
  try {
    const current = getStoredEodReports();
    const todayKey = getTodayDateKey();
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    const newReport = {
      id: `eod-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      employeeName: reportData.employeeName || "Team Member",
      employeeId: reportData.employeeId || `EMP-${Date.now()}`,
      date: reportData.date || todayKey,
      displayDate: formatDisplayDate(reportData.date || todayKey),
      received: Number(reportData.received) || 0,
      appointment: Number(reportData.appointment) || 0,
      login: Number(reportData.login) || 0,
      submittedAt: timeStr,
      status: "Submitted",
      notes: reportData.notes || ""
    };

    // If an EOD report already exists for this employee for this date, replace or prepend
    const existingIndex = current.findIndex(
      (r) => r.employeeName?.toLowerCase() === newReport.employeeName.toLowerCase() && r.date === newReport.date
    );

    let updated;
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...newReport };
    } else {
      updated = [newReport, ...current];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch event so other components update synchronously
    window.dispatchEvent(new CustomEvent("mhaveer-eod-updated", { detail: updated }));

    return { success: true, report: newReport };
  } catch (err) {
    console.error("Failed to save EOD report:", err);
    return { success: false, error: err.message };
  }
};

// Format EOD report strictly matching the reference WhatsApp structure
export const formatWhatsAppText = (report) => {
  if (!report) return "";
  const name = report.employeeName || "Team Member";
  const received = formatCount(report.received);
  const appointment = formatCount(report.appointment);
  const login = formatCount(report.login);

  return `Team Member: ${name}\n- Received: ${received}\n- Appointment: ${appointment}\n- Login: ${login}`;
};

// Filter reports by employee
export const getEmployeeEodReports = (employeeName) => {
  const all = getStoredEodReports();
  if (!employeeName) return all;
  return all.filter(
    (r) => r.employeeName?.toLowerCase() === employeeName.toLowerCase()
  );
};

// Get today's report for an employee
export const getEmployeeTodayReport = (employeeName) => {
  const all = getStoredEodReports();
  const todayKey = getTodayDateKey();
  return all.find(
    (r) =>
      r.date === todayKey &&
      (!employeeName || r.employeeName?.toLowerCase() === employeeName.toLowerCase())
  );
};

