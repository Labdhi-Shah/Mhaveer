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
  Copy,
  Check,
  Search,
  Filter,
  Download,
  Clock,
  AlertCircle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Eye,
  CheckCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { downloadXLSX } from "../utils/fileDownloader";
import {
  getStoredEodReports,
  saveEodReport,
  getTodayDateKey,
  formatDisplayDate,
  formatCount,
  formatWhatsAppText
} from "../utils/eodStorage";

export default function EodView() {
  const { user } = useAuth();
  const actualRole = getUserRole(user);
  const isManagerActual = actualRole === "Manager";

  // For testing/demonstration, allow role toggle if needed
  const [activeTab, setActiveTab] = useState(isManagerActual ? "manager" : "team");
  
  // EOD Form inputs
  const [receivedCount, setReceivedCount] = useState("");
  const [appointmentCount, setAppointmentCount] = useState("");
  const [loginCount, setLoginCount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedToday, setSubmittedToday] = useState(null);

  // Manager View states
  const [allReports, setAllReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // "today" | "all"
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [exporting, setExporting] = useState(false);

  const todayKey = getTodayDateKey();
  const todayDisplay = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const employeeName = user?.name || user?.fullName || (isManagerActual ? "Manager Admin" : "Shruti");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = () => {
    const data = getStoredEodReports();
    setAllReports(data);

    // Check if current user has already submitted for today
    const currentName = employeeName.toLowerCase();
    const todayRecord = data.find(
      (r) => r.employeeName?.toLowerCase() === currentName && r.date === todayKey
    );
    if (todayRecord) {
      setSubmittedToday(todayRecord);
      setReceivedCount(String(todayRecord.received));
      setAppointmentCount(String(todayRecord.appointment));
      setLoginCount(String(todayRecord.login));
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
  }, [user]);

  // Handle Form Submit
  const handleSubmitEod = (e) => {
    e.preventDefault();

    if (receivedCount === "" || appointmentCount === "" || loginCount === "") {
      showToast("Please enter values for Received, Appointment, and Login.", "error");
      return;
    }

    const receivedNum = parseInt(receivedCount, 10);
    const appointmentNum = parseInt(appointmentCount, 10);
    const loginNum = parseInt(loginCount, 10);

    if (isNaN(receivedNum) || isNaN(appointmentNum) || isNaN(loginNum)) {
      showToast("Please enter valid numeric counts.", "error");
      return;
    }

    if (receivedNum < 0 || appointmentNum < 0 || loginNum < 0) {
      showToast("Counts cannot be negative.", "error");
      return;
    }

    setSubmitting(true);

    const result = saveEodReport({
      employeeName,
      employeeId: user?.employeeId || user?._id || "EMP-CURRENT",
      date: todayKey,
      received: receivedNum,
      appointment: appointmentNum,
      login: loginNum,
      notes: "Daily telecalling outreach submitted."
    });

    setSubmitting(false);

    if (result.success) {
      setSubmittedToday(result.report);
      showToast("EOD report submitted successfully!", "success");
      loadData();
    } else {
      showToast("Failed to save EOD report.", "error");
    }
  };

  // Copy WhatsApp format
  const handleCopyWhatsApp = (report) => {
    const text = formatWhatsAppText(report);
    navigator.clipboard.writeText(text);
    setCopiedId(report.id || "current");
    showToast("Copied EOD report in WhatsApp format!", "success");
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Export to Excel for Manager
  const handleExportExcel = () => {
    if (!allReports || allReports.length === 0) {
      showToast("No EOD records available to export.", "error");
      return;
    }

    try {
      setExporting(true);
      const dataToExport = allReports.map((r) => ({
        "Submission Date": r.displayDate || r.date,
        "Team Member": r.employeeName,
        "Leads Received": r.received,
        "Appointments Completed": r.appointment,
        "Loan Applications Logged In": r.login,
        "Submitted Time": r.submittedAt || "N/A",
        "Status": r.status || "Submitted"
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const colWidths = Object.keys(dataToExport[0] || {}).map((key) => {
        const maxContentLength = Math.max(
          key.length,
          ...dataToExport.map((row) => String(row[key] !== undefined ? row[key] : "").length).slice(0, 50)
        );
        return { wch: Math.min(Math.max(maxContentLength + 4, 14), 40) };
      });
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Team EOD Reports");
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadXLSX(wb, `Team_EOD_Reports_${dateStr}.xlsx`);
      showToast(`Exported ${dataToExport.length} EOD records to Excel!`, "success");
    } catch (err) {
      console.error("Export error:", err);
      showToast("Failed to export EOD reports.", "error");
    } finally {
      setExporting(false);
    }
  };

  // Filtered reports for Manager
  const filteredManagerReports = allReports.filter((r) => {
    const matchesSearch =
      !searchTerm || r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = dateFilter === "today" ? r.date === todayKey : true;
    return matchesSearch && matchesDate;
  });

  // User's own history
  const myReports = allReports.filter(
    (r) => r.employeeName?.toLowerCase() === employeeName.toLowerCase()
  );

  // Aggregate stats for Manager
  const totalReceived = filteredManagerReports.reduce((acc, curr) => acc + (Number(curr.received) || 0), 0);
  const totalAppointment = filteredManagerReports.reduce((acc, curr) => acc + (Number(curr.appointment) || 0), 0);
  const totalLogin = filteredManagerReports.reduce((acc, curr) => acc + (Number(curr.login) || 0), 0);

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

      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#9ca3af] mb-1">
            <span className="p-1.5 bg-slate-100 rounded-lg text-[#162335]">
              <FileSpreadsheet size={16} />
            </span>
            <span>Mhaveer Telecalling Portal • EOD Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#162335]">
            End of Day (EOD) Reports
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1 flex items-center gap-2">
            <Calendar size={15} className="text-slate-400" />
            <span>Today: <strong className="text-slate-700">{todayDisplay}</strong></span>
          </p>
        </div>

        {/* View Switcher: Allows previewing both Team Member submission & Manager review */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("team")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              activeTab === "team"
                ? "bg-[#162335] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User size={15} />
            <span>Team Member Submission</span>
          </button>
          <button
            onClick={() => setActiveTab("manager")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              activeTab === "manager"
                ? "bg-[#162335] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck size={15} />
            <span>Manager Team Review</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          1. TEAM MEMBER SUBMISSION SECTION
          ======================================================== */}
      {activeTab === "team" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-[#162335] flex items-center gap-2">
                      <Send size={18} className="text-emerald-600" />
                      Daily EOD Submission Form
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Enter your daily Received, Appointment, and Login numbers
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
                  {/* Current Date Display */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                      <Calendar size={16} className="text-[#162335]" />
                      <span className="font-bold">Submission Date:</span>
                      <span className="font-mono font-black text-[#162335]">{formatDisplayDate(todayKey)}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                      Today
                    </span>
                  </div>

                  {/* 3 Input Fields Following WhatsApp Reference Structure */}
                  <div className="space-y-4">
                    {/* 1. Received */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                          <PhoneCall size={14} className="text-blue-600" />
                          <span>1. Received</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] font-semibold text-slate-400">
                          Number of leads received today
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="e.g. 106"
                          value={receivedCount}
                          onChange={(e) => setReceivedCount(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-200 text-base font-bold text-[#162335] rounded-2xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162335]/20 focus:border-[#162335] transition"
                        />
                      </div>
                    </div>

                    {/* 2. Appointment */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                          <CalendarCheck size={14} className="text-amber-600" />
                          <span>2. Appointment</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] font-semibold text-slate-400">
                          Number of appointments completed
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="e.g. 00"
                          value={appointmentCount}
                          onChange={(e) => setAppointmentCount(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-200 text-base font-bold text-[#162335] rounded-2xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162335]/20 focus:border-[#162335] transition"
                        />
                      </div>
                    </div>

                    {/* 3. Login */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>3. Login</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] font-semibold text-slate-400">
                          Number of loan applications logged in
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="e.g. 00"
                          value={loginCount}
                          onChange={(e) => setLoginCount(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-200 text-base font-bold text-[#162335] rounded-2xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162335]/20 focus:border-[#162335] transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#162335] hover:bg-slate-800 text-white font-black text-sm py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <Send size={16} />
                      <span>{submittedToday ? "Update EOD Report" : "Submit EOD"}</span>
                    </button>
                    <p className="text-[11px] text-center text-slate-400 font-semibold mt-2.5">
                      Submissions are immediately viewable by Telecalling Managers.
                    </p>
                  </div>
                </form>
              </div>
            </div>

            {/* Preview & WhatsApp Format Summary Column */}
            <div className="lg:col-span-5 space-y-6">
              {/* WhatsApp Screenshot Reference Preview Card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                      <MessageSquare size={16} />
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-[#162335]">
                        WhatsApp Report Preview
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-400">
                        Exact reference format
                      </p>
                    </div>
                  </div>
                  {submittedToday && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Submitted
                    </span>
                  )}
                </div>

                {/* The WhatsApp Formatted Card */}
                <div className="bg-[#e7f5ea] border border-emerald-200/80 rounded-2xl p-5 shadow-xs relative">
                  <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-3 border-b border-emerald-200 pb-2">
                    <span>Mhaveer Telecalling Daily EOD</span>
                    <span className="font-mono text-[11px]">{formatDisplayDate(todayKey)}</span>
                  </div>

                  {/* Content formatted like reference:
                      Team Member: Shruti
                      - Received: 106
                      - Appointment: 00
                      - Login: 00
                  */}
                  <div className="font-sans space-y-2 text-[#162335]">
                    <p className="font-black text-sm">
                      Team Member: <span className="text-emerald-900 underline decoration-emerald-400 underline-offset-4">{employeeName}</span>
                    </p>
                    <div className="font-mono text-sm space-y-1.5 pt-1 pl-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-bold">•</span>
                        <span className="font-semibold text-slate-700">Received:</span>
                        <span className="font-black text-blue-800">
                          {receivedCount !== "" ? receivedCount : "106"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-bold">•</span>
                        <span className="font-semibold text-slate-700">Appointment:</span>
                        <span className="font-black text-amber-800">
                          {formatCount(appointmentCount !== "" ? appointmentCount : 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-bold">•</span>
                        <span className="font-semibold text-slate-700">Login:</span>
                        <span className="font-black text-emerald-800">
                          {formatCount(loginCount !== "" ? loginCount : 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Copy Button */}
                  <div className="mt-4 pt-3 border-t border-emerald-200/70 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-700 font-medium">
                      Ready to paste into WhatsApp group
                    </span>
                    <button
                      onClick={() =>
                        handleCopyWhatsApp({
                          employeeName,
                          received: receivedCount !== "" ? receivedCount : 106,
                          appointment: appointmentCount !== "" ? appointmentCount : 0,
                          login: loginCount !== "" ? loginCount : 0
                        })
                      }
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3 py-1.5 rounded-xl transition shadow-xs cursor-pointer"
                    >
                      {copiedId === (submittedToday?.id || "current") ? (
                        <>
                          <Check size={13} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Help tip */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-slate-500 flex items-start gap-2">
                  <Sparkles size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    Your EOD report is instantly synchronized with the <strong>Manager Dashboard</strong> so supervisors can review today&apos;s team metrics.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Team Member's Own EOD Records History */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#162335] flex items-center gap-2">
                  <Calendar size={18} className="text-[#162335]" />
                  My EOD Submission History
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  View your past daily Received, Appointment, and Login records
                </p>
              </div>
              <span className="text-xs font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                Total Submissions: {myReports.length}
              </span>
            </div>

            {myReports.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No past EOD submissions found. Submit your first EOD above!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Date
                      </th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Received (Leads)
                      </th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Appointment
                      </th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Login (Apps)
                      </th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Submitted Time
                      </th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myReports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 text-xs font-black text-[#162335]">
                          {report.displayDate || report.date}
                          {report.date === todayKey && (
                            <span className="ml-2 bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full">
                              Today
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-black text-blue-700">
                          {report.received}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-black text-amber-700">
                          {formatCount(report.appointment)}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-black text-emerald-700">
                          {formatCount(report.login)}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-500">
                          {report.submittedAt || "N/A"}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-right">
                          <button
                            onClick={() => handleCopyWhatsApp(report)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-slate-600 font-bold transition"
                            title="Copy WhatsApp Format"
                          >
                            <Copy size={12} />
                            <span>Copy</span>
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

      {/* ========================================================
          2. MANAGER VIEW SECTION
          ======================================================== */}
      {activeTab === "manager" && (
        <div className="space-y-6">
          {/* Top Aggregate Metric Cards for Manager */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-[#162335]">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Total Team Reports
                </span>
                <span className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                  <User size={18} />
                </span>
              </div>
              <h3 className="text-3xl font-black text-[#162335] mt-2">
                {filteredManagerReports.length}
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                Team member submissions
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-blue-600">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
                  Total Leads Received
                </span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <PhoneCall size={18} />
                </span>
              </div>
              <h3 className="text-3xl font-black text-blue-900 mt-2">
                {totalReceived}
              </h3>
              <p className="text-[11px] font-semibold text-blue-600/80 mt-0.5">
                Aggregated leads handled
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-amber-500">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
                  Total Appointments
                </span>
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <CalendarCheck size={18} />
                </span>
              </div>
              <h3 className="text-3xl font-black text-amber-900 mt-2">
                {formatCount(totalAppointment)}
              </h3>
              <p className="text-[11px] font-semibold text-amber-600/80 mt-0.5">
                Completed appointments
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-emerald-500">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                  Total Loan Logins
                </span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 size={18} />
                </span>
              </div>
              <h3 className="text-3xl font-black text-emerald-900 mt-2">
                {formatCount(totalLogin)}
              </h3>
              <p className="text-[11px] font-semibold text-emerald-600/80 mt-0.5">
                Applications logged in
              </p>
            </div>
          </div>

          {/* Manager Controls: Search, Filters, Excel Export */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search team member name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#162335]/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setDateFilter("all")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    dateFilter === "all"
                      ? "bg-[#162335] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All Records
                </button>
                <button
                  onClick={() => setDateFilter("today")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    dateFilter === "today"
                      ? "bg-[#162335] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Today Only
                </button>
              </div>

              <button
                onClick={handleExportExcel}
                disabled={exporting || filteredManagerReports.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs whitespace-nowrap"
                title="Export EOD table to Excel"
              >
                <Download size={14} />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Grid of Team Member WhatsApp Cards */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="border-b border-slate-100 pb-4 mb-6">
              <h3 className="text-base sm:text-lg font-black text-[#162335] flex items-center gap-2">
                <MessageSquare size={18} className="text-emerald-600" />
                Team EOD Cards (WhatsApp Format Presentation)
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Exact report layout matching WhatsApp daily reporting standards
              </p>
            </div>

            {filteredManagerReports.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No EOD reports match your current filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredManagerReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Member Title */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 mb-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Team Member
                          </span>
                          <h4 className="text-sm font-black text-[#162335]">
                            {report.employeeName}
                          </h4>
                        </div>
                        <button
                          onClick={() => handleCopyWhatsApp(report)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Copy WhatsApp Text"
                        >
                          {copiedId === report.id ? (
                            <span className="text-emerald-600 text-[10px] font-black flex items-center gap-0.5">
                              <Check size={12} /> Copied
                            </span>
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>

                      {/* WhatsApp Reference Formatted Box */}
                      <div className="bg-[#f0f4f9]/80 border border-slate-200/80 rounded-xl p-3 font-mono text-xs text-slate-800 space-y-1.5">
                        <div className="font-sans font-bold text-[10px] text-slate-500 mb-1 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>EOD Report</span>
                          <span className="text-[9px] text-slate-400 font-normal">
                            {report.displayDate || report.date}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-0.5">
                          <span className="font-semibold text-slate-600">• Received:</span>
                          <span className="font-black text-blue-700 font-mono text-sm">
                            {report.received}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-0.5">
                          <span className="font-semibold text-slate-600">• Appointment:</span>
                          <span className="font-black text-amber-700 font-mono text-sm">
                            {formatCount(report.appointment)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-0.5">
                          <span className="font-semibold text-slate-600">• Login:</span>
                          <span className="font-black text-emerald-700 font-mono text-sm">
                            {formatCount(report.login)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {report.submittedAt || "Submitted"}
                      </span>
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {report.status || "Submitted"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Performance Table for Manager */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base sm:text-lg font-black text-[#162335]">
                Complete Team EOD Log Table
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Tabular breakdown of daily employee metrics
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="py-3.5 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Team Member
                    </th>
                    <th className="py-3.5 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Date
                    </th>
                    <th className="py-3.5 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Received
                    </th>
                    <th className="py-3.5 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Appointment
                    </th>
                    <th className="py-3.5 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Login
                    </th>
                    <th className="py-3.5 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Submitted Time
                    </th>
                    <th className="py-3.5 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                      WhatsApp Text
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredManagerReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 text-xs font-black text-[#162335]">
                        {report.employeeName}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                        {report.displayDate || report.date}
                        {report.date === todayKey && (
                          <span className="ml-2 bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                            Today
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-black text-blue-700">
                        {report.received}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-black text-amber-700">
                        {formatCount(report.appointment)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-black text-emerald-700">
                        {formatCount(report.login)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-500">
                        {report.submittedAt || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-right">
                        <button
                          onClick={() => handleCopyWhatsApp(report)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-slate-600 font-bold transition"
                          title="Copy WhatsApp Format"
                        >
                          <Copy size={12} />
                          <span>Copy</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

