import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserRole } from "../utils/hierarchy";
import {
  FileSpreadsheet,
  Send,
  Calendar,
  User,
  PhoneCall,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Download,
  Clock,
  Users,
  Filter,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { downloadXLSX } from "../utils/fileDownloader";
import {
  getStoredEodReports,
  saveEodReport,
  getEmployeeSubmissions,
  getTeamSubmissionsForManager,
  deleteEodRecord,
  formatDisplayDate,
  getTodayDateString
} from "../utils/eodStorage";

export default function EodView() {
  const { user } = useAuth();
  const role = getUserRole(user);
  const isManager = role === "Manager";

  // Form input states (starts blank, no demo values)
  const [submissionDate, setSubmissionDate] = useState(getTodayDateString());
  const [receivedCount, setReceivedCount] = useState("");
  const [appointmentCount, setAppointmentCount] = useState("");
  const [loginCount, setLoginCount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Employee history states
  const [myRecords, setMyRecords] = useState([]);
  const [dateFilter, setDateFilter] = useState("");

  // Manager-only states (only used if logged-in user is a Manager)
  const [managerTab, setManagerTab] = useState("team-reports"); // "team-reports" | "submit-eod"
  const [teamRecords, setTeamRecords] = useState([]);
  const [managerDateFilter, setManagerDateFilter] = useState("");
  const [managerSearchTerm, setManagerSearchTerm] = useState("");
  const [exporting, setExporting] = useState(false);

  const employeeName = user?.name || user?.fullName || "Employee";

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load submissions based on role and active filters
  const loadData = () => {
    if (!user) return;

    // Load current employee's own records (strict privacy: Employee A only sees Employee A)
    const empSubmissions = getEmployeeSubmissions(user, dateFilter);
    setMyRecords(empSubmissions);

    // If Manager, load team submissions
    if (isManager) {
      const allTeam = getTeamSubmissionsForManager(user, managerDateFilter, managerSearchTerm);
      setTeamRecords(allTeam);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener("mhaveer-eod-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("mhaveer-eod-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [user, dateFilter, managerDateFilter, managerSearchTerm, isManager]);

  // Handle EOD Form Submission
  const handleSubmitEod = (e) => {
    e.preventDefault();

    if (!submissionDate) {
      showToast("Please select a date for the EOD submission.", "error");
      return;
    }

    if (receivedCount === "" || appointmentCount === "" || loginCount === "") {
      showToast("Please enter values for Received, Appointment, and Login.", "error");
      return;
    }

    const rec = parseInt(receivedCount, 10);
    const app = parseInt(appointmentCount, 10);
    const log = parseInt(loginCount, 10);

    if (isNaN(rec) || isNaN(app) || isNaN(log) || rec < 0 || app < 0 || log < 0) {
      showToast("Please enter valid, non-negative numbers.", "error");
      return;
    }

    setSubmitting(true);

    const result = saveEodReport({
      user,
      date: submissionDate, // Manually selected date
      received: rec,
      appointment: app,
      login: log
    });

    setSubmitting(false);

    if (result.success) {
      showToast(`EOD report for ${formatDisplayDate(submissionDate)} saved successfully!`, "success");
      // Clear inputs for clean next entry
      setReceivedCount("");
      setAppointmentCount("");
      setLoginCount("");
      loadData();
    } else {
      showToast(result.error || "Failed to save EOD report.", "error");
    }
  };

  // Handle Record Deletion
  const handleDelete = (recordId) => {
    if (window.confirm("Are you sure you want to delete this EOD submission?")) {
      const ok = deleteEodRecord(recordId);
      if (ok) {
        showToast("EOD record deleted.", "success");
        loadData();
      }
    }
  };

  // Export Team Records to Excel (Manager only)
  const handleExportExcel = () => {
    if (teamRecords.length === 0) {
      showToast("No records available to export.", "error");
      return;
    }

    try {
      setExporting(true);
      const dataToExport = teamRecords.map((r) => ({
        "Team Member": r.employeeName,
        "Employee ID": r.employeeId || "-",
        "Date": r.displayDate || r.date,
        "Received (Leads)": r.received,
        "Appointments Completed": r.appointment,
        "Applications Logged In": r.login,
        "Submitted Time": r.submittedAt || "-"
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const colWidths = Object.keys(dataToExport[0] || {}).map((key) => {
        const maxLen = Math.max(
          key.length,
          ...dataToExport.map((row) => String(row[key] !== undefined ? row[key] : "").length).slice(0, 50)
        );
        return { wch: Math.min(Math.max(maxLen + 4, 14), 40) };
      });
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Team EOD Records");
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadXLSX(wb, `Team_EOD_Records_${dateStr}.xlsx`);
      showToast("Exported team EOD records to Excel!", "success");
    } catch (err) {
      console.error("Export error:", err);
      showToast("Failed to export Excel file.", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
            ) : (
              <AlertCircle className="text-rose-600 shrink-0" size={20} />
            )}
            <span className="text-sm font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#9ca3af] mb-1">
            <span className="p-1.5 bg-slate-100 rounded-lg text-[#162335]">
              <FileSpreadsheet size={16} />
            </span>
            <span>Mhaveer Telecalling Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#162335]">
            End of Day (EOD)
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            {isManager
              ? "View team member EOD submissions and submit your own daily report."
              : "Submit and view your daily Received, Appointment, and Login counts."}
          </p>
        </div>

        {/* Manager Mode Tabs (Only visible to Managers) */}
        {isManager && (
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto">
            <button
              onClick={() => setManagerTab("team-reports")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
                managerTab === "team-reports"
                  ? "bg-[#162335] text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users size={15} />
              <span>Team Submissions</span>
            </button>
            <button
              onClick={() => setManagerTab("submit-eod")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
                managerTab === "submit-eod"
                  ? "bg-[#162335] text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Send size={15} />
              <span>Submit EOD</span>
            </button>
          </div>
        )}
      </div>

      {/* =========================================================
          VIEW 1: EMPLOYEE EOD SUBMISSION & PERSONAL HISTORY
          (Shown to all employees, or to managers on "submit-eod" tab)
          ========================================================= */}
      {(!isManager || managerTab === "submit-eod") && (
        <div className="space-y-6">
          {/* Submission Form Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-black text-[#162335] flex items-center gap-2">
                  <Send size={18} className="text-emerald-600" />
                  EOD Submission Form
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Select the submission date and enter your daily performance metrics
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Submitting As
                </span>
                <span className="text-xs font-black text-[#162335] bg-slate-100 px-2.5 py-1 rounded-lg inline-block mt-0.5">
                  {employeeName}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitEod} className="space-y-5">
              {/* Date Selection: Employees can select and enter the date manually */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 mb-1.5">
                    <Calendar size={14} className="text-[#162335]" />
                    <span>Submission Date</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={submissionDate}
                    onChange={(e) => setSubmissionDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-sm font-bold text-[#162335] rounded-2xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162335]/20 focus:border-[#162335] transition"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Selected: <strong>{formatDisplayDate(submissionDate)}</strong>
                  </span>
                </div>
              </div>

              {/* The Three Required Fields: Received, Appointment, Login */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* 1. Received */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                      <PhoneCall size={14} className="text-blue-600" />
                      <span>Received</span>
                      <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Enter count"
                    value={receivedCount}
                    onChange={(e) => setReceivedCount(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-base font-bold text-[#162335] rounded-2xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162335]/20 focus:border-[#162335] transition"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Number of leads received
                  </span>
                </div>

                {/* 2. Appointment */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                      <CalendarCheck size={14} className="text-purple-600" />
                      <span>Appointment</span>
                      <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Enter count"
                    value={appointmentCount}
                    onChange={(e) => setAppointmentCount(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-base font-bold text-[#162335] rounded-2xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162335]/20 focus:border-[#162335] transition"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Number of appointments completed
                  </span>
                </div>

                {/* 3. Login */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>Login</span>
                      <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Enter count"
                    value={loginCount}
                    onChange={(e) => setLoginCount(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-base font-bold text-[#162335] rounded-2xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162335]/20 focus:border-[#162335] transition"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Number of loan applications logged in
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto bg-[#162335] hover:bg-slate-800 text-white font-black text-sm py-3 px-8 rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send size={16} />
                  <span>Submit EOD</span>
                </button>
              </div>
            </form>
          </div>

          {/* Employee's Own Submitted Records (Strict Privacy: Employee A only sees Employee A) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#162335] flex items-center gap-2">
                  <Clock size={18} className="text-[#162335]" />
                  My EOD Records
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Your submitted daily EOD history (visible only to you)
                </p>
              </div>

              {/* Date Filter for Employee History */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#162335]"
                    title="Filter submissions by date"
                  />
                </div>
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter("")}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 underline transition"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            {/* Empty State / Table */}
            {myRecords.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <FileSpreadsheet size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-600">No EOD records found</p>
                <p className="text-xs text-slate-400 mt-1">
                  {dateFilter
                    ? `No submissions found for ${formatDisplayDate(dateFilter)}.`
                    : "You have not submitted any EOD reports yet. Use the form above to add your first record."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Submission Date
                      </th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Received
                      </th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Appointment
                      </th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Login
                      </th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Submitted At
                      </th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 text-xs font-black text-[#162335]">
                          {record.displayDate || record.date}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-bold text-blue-700">
                          {record.received}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-bold text-purple-700">
                          {record.appointment}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-bold text-emerald-700">
                          {record.login}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-500">
                          {record.submittedAt || "-"}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-right">
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete this record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          VIEW 2: MANAGER TEAM SUBMISSIONS REVIEW
          (Only visible when logged-in user is a Manager on team tab)
          ========================================================= */}
      {isManager && managerTab === "team-reports" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
              <div>
                <h2 className="text-lg md:text-xl font-black text-[#162335] flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  Team EOD Submissions
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Daily EOD records submitted by your team members
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleExportExcel}
                  disabled={exporting || teamRecords.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                  title="Export team records to Excel"
                >
                  <Download size={14} />
                  <span>Export to Excel</span>
                </button>
              </div>
            </div>

            {/* Filter Bar: Date and Member Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Calendar size={13} /> Filter Date:
                </span>
                <input
                  type="date"
                  value={managerDateFilter}
                  onChange={(e) => setManagerDateFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#162335]"
                />
                {managerDateFilter && (
                  <button
                    onClick={() => setManagerDateFilter("")}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 underline transition"
                  >
                    All Dates
                  </button>
                )}
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search team member name..."
                  value={managerSearchTerm}
                  onChange={(e) => setManagerSearchTerm(e.target.value)}
                  className="bg-white border border-slate-200 text-xs font-semibold rounded-xl pl-8 pr-3 py-1.5 w-56 focus:outline-none focus:ring-1 focus:ring-[#162335]"
                />
              </div>
            </div>

            {/* Empty State / Table */}
            {teamRecords.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Users size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-600">No team EOD reports submitted yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  {managerDateFilter || managerSearchTerm
                    ? "No records match your current filter."
                    : "When team members submit their daily EOD reports, their actual entries will appear here."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Team Member Name
                      </th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Date
                      </th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Received
                      </th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Appointment
                      </th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Login
                      </th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Submitted Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 text-xs font-black text-[#162335]">
                          {record.employeeName}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                          {record.displayDate || record.date}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-bold text-blue-700">
                          {record.received}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-bold text-purple-700">
                          {record.appointment}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-bold text-emerald-700">
                          {record.login}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-500">
                          {record.submittedAt || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
