/**
 * EOD (End of Day) Storage and State Utilities
 * Frontend-only mock storage using localStorage with sample team data
 */

const STORAGE_KEY = "mhaveer_eod_reports";

// Predefined team members in the telecalling department
export const DEFAULT_TEAM_MEMBERS = [
  { id: "EMP-SHRUTI", name: "Shruti" },
  { id: "EMP-PRIYA", name: "Priya Sharma" },
  { id: "EMP-AMIT", name: "Amit Patel" },
  { id: "EMP-NEHA", name: "Neha Gupta" },
  { id: "EMP-RAHUL", name: "Rahul Verma" },
  { id: "EMP-POOJA", name: "Pooja Joshi" }
];

// Format numbers: 0 as "00", 5 as "05", 106 as "106"
export const formatCount = (val) => {
  if (val === undefined || val === null || val === "" || val === "-") return "00";
  const num = parseInt(val, 10);
  if (isNaN(num)) return "00";
  return num < 10 && num >= 0 ? `0${num}` : `${num}`;
};

// Generate today's date string YYYY-MM-DD
export const getTodayDateKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Generate date key for N days ago YYYY-MM-DD
export const getDaysAgoDateKey = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getYesterdayDateKey = () => getDaysAgoDateKey(1);

// Format date string to display format (e.g. "01 Nov 2026")
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

// Initial default mock data across multiple dates
const getInitialMockReports = () => {
  const todayKey = getTodayDateKey();
  const yesterdayKey = getDaysAgoDateKey(1);
  const twoDaysAgoKey = getDaysAgoDateKey(2);

  return [
    // Today's Submissions (4 submitted, 2 not yet submitted today)
    {
      id: "eod-today-1",
      employeeName: "Shruti",
      employeeId: "EMP-SHRUTI",
      date: todayKey,
      displayDate: formatDisplayDate(todayKey),
      received: 106,
      appointment: 0,
      login: 0,
      submittedAt: "06:45 PM"
    },
    {
      id: "eod-today-2",
      employeeName: "Priya Sharma",
      employeeId: "EMP-PRIYA",
      date: todayKey,
      displayDate: formatDisplayDate(todayKey),
      received: 88,
      appointment: 4,
      login: 2,
      submittedAt: "06:30 PM"
    },
    {
      id: "eod-today-3",
      employeeName: "Amit Patel",
      employeeId: "EMP-AMIT",
      date: todayKey,
      displayDate: formatDisplayDate(todayKey),
      received: 112,
      appointment: 6,
      login: 3,
      submittedAt: "07:15 PM"
    },
    {
      id: "eod-today-4",
      employeeName: "Neha Gupta",
      employeeId: "EMP-NEHA",
      date: todayKey,
      displayDate: formatDisplayDate(todayKey),
      received: 94,
      appointment: 3,
      login: 1,
      submittedAt: "06:20 PM"
    },

    // Yesterday's Submissions
    {
      id: "eod-yesterday-1",
      employeeName: "Shruti",
      employeeId: "EMP-SHRUTI",
      date: yesterdayKey,
      displayDate: formatDisplayDate(yesterdayKey),
      received: 98,
      appointment: 2,
      login: 1,
      submittedAt: "06:40 PM"
    },
    {
      id: "eod-yesterday-2",
      employeeName: "Rahul Verma",
      employeeId: "EMP-RAHUL",
      date: yesterdayKey,
      displayDate: formatDisplayDate(yesterdayKey),
      received: 75,
      appointment: 2,
      login: 1,
      submittedAt: "07:00 PM"
    },
    {
      id: "eod-yesterday-3",
      employeeName: "Amit Patel",
      employeeId: "EMP-AMIT",
      date: yesterdayKey,
      displayDate: formatDisplayDate(yesterdayKey),
      received: 105,
      appointment: 5,
      login: 2,
      submittedAt: "06:55 PM"
    },
    {
      id: "eod-yesterday-4",
      employeeName: "Priya Sharma",
      employeeId: "EMP-PRIYA",
      date: yesterdayKey,
      displayDate: formatDisplayDate(yesterdayKey),
      received: 82,
      appointment: 3,
      login: 1,
      submittedAt: "06:15 PM"
    },
    {
      id: "eod-yesterday-5",
      employeeName: "Pooja Joshi",
      employeeId: "EMP-POOJA",
      date: yesterdayKey,
      displayDate: formatDisplayDate(yesterdayKey),
      received: 68,
      appointment: 1,
      login: 0,
      submittedAt: "06:10 PM"
    },

    // Two days ago Submissions
    {
      id: "eod-2days-1",
      employeeName: "Shruti",
      employeeId: "EMP-SHRUTI",
      date: twoDaysAgoKey,
      displayDate: formatDisplayDate(twoDaysAgoKey),
      received: 102,
      appointment: 1,
      login: 1,
      submittedAt: "06:50 PM"
    },
    {
      id: "eod-2days-2",
      employeeName: "Priya Sharma",
      employeeId: "EMP-PRIYA",
      date: twoDaysAgoKey,
      displayDate: formatDisplayDate(twoDaysAgoKey),
      received: 90,
      appointment: 3,
      login: 2,
      submittedAt: "06:25 PM"
    },
    {
      id: "eod-2days-3",
      employeeName: "Neha Gupta",
      employeeId: "EMP-NEHA",
      date: twoDaysAgoKey,
      displayDate: formatDisplayDate(twoDaysAgoKey),
      received: 85,
      appointment: 2,
      login: 1,
      submittedAt: "06:35 PM"
    }
  ];
};

// Retrieve all stored reports from localStorage
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

// Get the full list of team members, including current logged-in user if applicable
export const getAllTeamMembers = (currentUser) => {
  const members = [...DEFAULT_TEAM_MEMBERS];
  if (currentUser) {
    const currentName = currentUser.name || currentUser.fullName;
    if (currentName) {
      const exists = members.some((m) => m.name.toLowerCase() === currentName.toLowerCase());
      if (!exists && currentUser.role !== "Manager") {
        members.unshift({
          id: currentUser.employeeId || currentUser._id || "EMP-CURRENT",
          name: currentName
        });
      }
    }
  }
  return members;
};

// Save an EOD submission for a specific day
export const saveEodReport = (reportData) => {
  try {
    const current = getStoredEodReports();
    const todayKey = getTodayDateKey();
    const targetDate = reportData.date || todayKey;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    const newReport = {
      id: `eod-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      employeeName: reportData.employeeName || "Shruti",
      employeeId: reportData.employeeId || `EMP-${Date.now()}`,
      date: targetDate,
      displayDate: formatDisplayDate(targetDate),
      received: Number(reportData.received) || 0,
      appointment: Number(reportData.appointment) || 0,
      login: Number(reportData.login) || 0,
      submittedAt: timeStr
    };

    // If an entry exists for this member on this date, update it (separate entry per day)
    const existingIndex = current.findIndex(
      (r) =>
        r.employeeName?.toLowerCase() === newReport.employeeName.toLowerCase() &&
        r.date === targetDate
    );

    let updated;
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...newReport };
    } else {
      updated = [newReport, ...current];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Notify all listening components immediately
    window.dispatchEvent(new CustomEvent("mhaveer-eod-updated", { detail: updated }));

    return { success: true, report: newReport };
  } catch (err) {
    console.error("Failed to save EOD report:", err);
    return { success: false, error: err.message };
  }
};

// Format WhatsApp text reference string
export const formatWhatsAppText = (report) => {
  if (!report) return "";
  const name = report.employeeName || "Team Member";
  const received = report.received !== undefined && report.received !== null ? report.received : "0";
  const appointment = formatCount(report.appointment);
  const login = formatCount(report.login);

  return `Team Member: ${name}\n- Received: ${received}\n- Appointment: ${appointment}\n- Login: ${login}`;
};

// Get a team member's full EOD history, sorted most recent first
export const getEmployeeEodHistory = (employeeName) => {
  const all = getStoredEodReports();
  if (!employeeName) return all;
  return all
    .filter((r) => r.employeeName?.toLowerCase() === employeeName.toLowerCase())
    .sort((a, b) => (b.date > a.date ? 1 : -1));
};

// Get today's submitted EOD for an employee (or null if not yet submitted)
export const getEmployeeTodayEod = (employeeName) => {
  const all = getStoredEodReports();
  const todayKey = getTodayDateKey();
  if (!employeeName) return null;
  return all.find(
    (r) =>
      r.employeeName?.toLowerCase() === employeeName.toLowerCase() &&
      r.date === todayKey
  ) || null;
};

// Get status breakdown for all team members for a given date
// Returns: list of members with hasSubmitted: true/false, received, appointment, login
export const getTeamEodStatusByDate = (dateKey, currentUser) => {
  const allReports = getStoredEodReports();
  const teamMembers = getAllTeamMembers(currentUser);

  // Filter reports for the given date
  const dateReports = allReports.filter((r) => r.date === dateKey);
  const reportsByMember = new Map();
  dateReports.forEach((r) => {
    if (r.employeeName) {
      reportsByMember.set(r.employeeName.toLowerCase(), r);
    }
  });

  return teamMembers.map((member) => {
    const report = reportsByMember.get(member.name.toLowerCase());
    return {
      id: member.id,
      employeeName: member.name,
      date: dateKey,
      displayDate: formatDisplayDate(dateKey),
      hasSubmitted: Boolean(report),
      received: report ? report.received : "-",
      appointment: report ? report.appointment : "-",
      login: report ? report.login : "-",
      submittedAt: report ? report.submittedAt : "-",
      reportObject: report || null
    };
  });
};
