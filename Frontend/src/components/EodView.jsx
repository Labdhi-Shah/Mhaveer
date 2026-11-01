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
  Copy,
  Check,
  Search,
  Download,
  Clock,
  Users,
  UserCheck,
  UserX,
  MessageSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { downloadXLSX } from "../utils/fileDownloader";
import {
  getStoredEodReports,
  saveEodReport,
  getTodayDateKey,
  getYesterdayDateKey,
  getDaysAgoDateKey,
  formatDisplayDate,
  formatCount,
  formatWhatsAppText,
  getAllTeamMembers,
  getTeamEodStatusByDate,
  getEmployeeEodHistory,
  getEmployeeTodayEod
} from "../utils/eodStorage";

export default function EodView() {
  const { user } = useAuth();
  const role = getUserRole(user);
  const isManagerRole = role === "Manager";

  // Active view: either team member view or manager view
  const [activeView, setActiveView] = useState(isManagerRole ? "manager" : "team");

  // Team Member Form states
  const [receivedInput, setReceivedInput] = useState("");
  const [appointmentInput, setAppointmentInput] = useState("");
  const [loginInput, setLoginInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [todayEod, setTodayEod] = useState(null);
  const [myHistory, setMyHistory] = useState([]);

  // Manager states
  const [selectedDate, setSelectedDate] = useState(getTodayDateKey());
  const [managerViewMode, setManagerViewMode] = useState("date-wise"); // "date-wise" | "member-wise"
  const [selectedMember, setSelectedMember] = useState("Shruti");
  const [managerStatusFilter, setManagerStatusFilter] = useState("all"); // "all" | "submitted" | "pending"
  const [searchTerm, setSearchTerm] = useState("");
  const [dateStatusList, setDateStatusList] = useState([]);
  const [teamMembersList, setTeamMembersList] = useState([]);

  // UI helpers
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const todayKey = getTodayDateKey();
  const yesterdayKey = getYesterdayDateKey();

  const formattedCurrentDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const employeeName = user?.name || user?.fullName || (isManagerRole ? "Shruti" : "Shruti");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAllData = () => {
    // Team member today's submission & history
    const todayRecord = getEmployeeTodayEod(employeeName);
    setTodayEod(todayRecord);
    if (todayRecord) {
      setReceivedInput(String(todayRecord.received));
      setAppointmentInput(String(todayRecord.appointment));
      setLoginInput(String(todayRecord.login));
    }

    const history = getEmployeeEodHistory(employeeName);
    setMyHistory(history);

    // Manager status breakdown for selected date
    const list = getTeamEodStatusByDate(selectedDate, user);
    setDateStatusList(list);

    const members = getAllTeamMembers(user);
    setTeamMembersList(members);
  };

  useEffect(() => {
    loadAllData();

    const handleUpdate = () => {
      loadAllData();
    };

    window.addEventListener("mhaveer-eod-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("mhaveer-eod-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [employeeName, selectedDate, user]);

  // Handle Team Member EOD Submit
  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (receivedInput === "" || appointmentInput === "" || loginInput === "") {
      showToast("Please enter values for Received, Appointment, and Login.", "error");
      return;
    }

    const rec = parseInt(receivedInput, 10);
    const app = parseInt(appointmentInput, 10);
    const log = parseInt(loginInput, 10);

    if (isNaN(rec) || isNaN(app) || isNaN(log) || rec < 0 || app < 0 || log < 0) {
      showToast("Please enter valid, non-negative numbers.", "error");
      return;
    }

    setSubmitting(true);

    const result = saveEodReport({
      employeeName,
      employeeId: user?.employeeId || user?._id || "EMP-SHRUTI",
      date: todayKey,
      received: rec,
      appointment: app,
      login: log
    });

    setSubmitting(false);

    if (result.success) {
      setTodayEod(result.report);
      showToast("EOD report submitted successfully! It is now visible to your Manager.", "success");
      loadAllData();
    } else {
      showToast("Failed to save EOD report.", "error");
    }
  };

  // Copy WhatsApp Format
  const handleCopy = (report) => {
    if (!report) return;
    const text = formatWhatsAppText(report);
    navigator.clipboard.writeText(text);
    setCopiedId(report.id || report.employeeName || "current");
    showToast("Copied EOD report in WhatsApp format!", "success");
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Export to Excel for Manager
  const handleExportExcel = () => {
    try {
      setExporting(true);
      const dataToExport = dateStatusList.map((item) => ({
        "Team Member": item.employeeName,
        "Date": item.displayDate,
        "Received": item.hasSubmitted ? item.received : "-",
        "Appointment": item.hasSubmitted ? item.appointment : "-",
        "Login": item.hasSubmitted ? item.login : "-",
        "Submission Status": item.hasSubmitted ? "Submitted" : "Not Submitted",
        "Submitted Time": item.submittedAt || "-"
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
      XLSX.utils.book_append_sheet(wb, ws, "Team Daily EOD");
      downloadXLSX(wb, `Team_Daily_EOD_${selectedDate}.xlsx`);
      showToast("Exported daily EOD data to Excel!", "success");
    } catch (err) {
      console.error("Export error:", err);
      showToast("Failed to export Excel file.", "error");
    } finally {
      setExporting(false);
    }
  };

  // Manager calculations
  const filteredDateList = dateStatusList.filter((item) => {
    const matchesSearch =
      !searchTerm || item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      managerStatusFilter === "all"
        ? true
        : managerStatusFilter === "submitted"
        ? item.hasSubmitted
        : !item.hasSubmitted;
    return matchesSearch && matchesStatus;
  });

  const submittedCount = dateStatusList.filter((i) => i.hasSubmitted).length;
  const pendingCount = dateStatusList.filter((i) => !i.hasSubmitted).length;
  const totalReceived = dateStatusList.reduce(
    (acc, curr) => acc + (curr.hasSubmitted ? Number(curr.received) || 0 : 0),
    0
  );
  const totalAppointment = dateStatusList.reduce(
    (acc, curr) => acc + (curr.hasSubmitted ? Number(curr.appointment) || 0 : 0),
    0
  );
  const totalLogin = dateStatusList.reduce(
    (acc, curr) => acc + (curr.hasSubmitted ? Number(curr.login) || 0 : 0),
    0
  );

  const selectedMemberHistory = getEmployeeEodHistory(selectedMember);

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
            <span>Mhaveer Telecalling Portal • Daily EOD Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#162335]">
            End of Day (EOD)
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1 flex items-center gap-2">
            <Calendar size={15} className="text-slate-400" />
            <span>Today&apos;s Date: <strong className="text-slate-700">{formattedCurrentDate}</strong></span>
          </p>
        </div>

        {/* View Switcher: Team Member vs Manager View */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setActiveView("team")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              activeView === "team"
                ? "bg-[#162335] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User size={15} />
            <span>Team Member Submission</span>
          </button>
          <button
            onClick={() => setActiveView("manager")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              activeView === "manager"
                ? "bg-[#162335] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users size={15} />
            <span>Manager Team View</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          1. TEAM MEMBER – DAILY EOD SUBMISSION
          ======================================================== */}
      {activeView === "team" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: EOD Submission Form with the 3 required fields */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-[#162335] flex items-center gap-2">
                      <Send size={18} className="text-emerald-600" />
                      Daily EOD Submission
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Enter your daily numbers for Received, Appointment, and Login
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Team Member
                    </span>
                    <span className="text-xs font-black text-[#162335] bg-slate-100 px-2.5 py-1 rounded-lg inline-block mt-0.5">
                      {employeeName}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-5">
                  {/* Automatically Display Submission Date */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Calendar size={16} className="text-[#162335]" />
                      <span className="font-bold">Submission Date:</span>
                      <span className="font-mono font-black text-[#162335]">
                        {formatDisplayDate(todayKey)}
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                      Auto-detected Today
                    </span>
                  </div>

                  {/* Exactly 3 Numeric Fields: Received, Appointment, Login */}
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
                          Number of leads received
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="e.g. 106"
                        value={receivedInput}
                        onChange={(e) => setReceivedInput(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 text-base font-bold text-[#162335] rounded-2xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162335]/20 focus:border-[#162335] transition"
                      />
                    </div>

                    {/* 2. Appointment */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                          <CalendarCheck size={14} className="text-purple-600" />
                          <span>2. Appointment</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] font-semibold text-slate-400">
                          Number of appointments completed
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="e.g. 00"
                        value={appointmentInput}
                        onChange={(e) => setAppointmentInput(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 text-base font-bold text-[#162335] rounded-2xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162335]/20 focus:border-[#162335] transition"
                      />
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
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="e.g. 00"
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 text-base font-bold text-[#162335] rounded-2xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162335]/20 focus:border-[#162335] transition"
                      />
                    </div>
                  </div>

                  {/* Submit EOD Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#162335] hover:bg-slate-800 text-white font-black text-sm py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <Send size={16} />
                      <span>{todayEod ? "Update Today's EOD" : "Submit EOD"}</span>
                    </button>
                    <p className="text-[11px] text-center text-slate-400 font-semibold mt-2.5">
                      Submissions immediately appear on your Manager&apos;s daily monitoring dashboard.
                    </p>
                  </div>
                </form>
              </div>
            </div>

            {/* Right: Display Today's Submitted EOD Clearly */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                      <MessageSquare size={16} />
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-[#162335]">
                        Today&apos;s Submitted EOD
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-400">
                        WhatsApp Reference Format
                      </p>
                    </div>
                  </div>
                  {todayEod ? (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={11} /> Submitted
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Clock size={11} /> Not Submitted
                    </span>
                  )}
                </div>

                {/* WhatsApp Format Box */}
                <div className="bg-[#e7f5ea] border border-emerald-200/80 rounded-2xl p-5 shadow-xs relative">
                  <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-3 border-b border-emerald-200 pb-2">
                    <span>EOD Daily Summary</span>
                    <span className="font-mono text-[11px]">{formatDisplayDate(todayKey)}</span>
                  </div>

                  {/* Clean structure matching screenshot:
                      Team Member: Shruti
                      - Received: 106
                      - Appointment: 00
                      - Login: 00
                  */}
                  <div className="space-y-2 text-[#162335]">
                    <p className="font-black text-sm">
                      Team Member: <span className="text-emerald-900 underline decoration-emerald-400 underline-offset-4">{employeeName}</span>
                    </p>
                    <div className="font-mono text-sm space-y-1.5 pt-1 pl-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-bold">•</span>
                        <span className="font-semibold text-slate-700">Received:</span>
                        <span className="font-black text-blue-800">
                          {receivedInput !== "" ? receivedInput : (todayEod ? todayEod.received : "106")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-bold">•</span>
                        <span className="font-semibold text-slate-700">Appointment:</span>
                        <span className="font-black text-purple-800">
                          {formatCount(appointmentInput !== "" ? appointmentInput : (todayEod ? todayEod.appointment : 0))}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-bold">•</span>
                        <span className="font-semibold text-slate-700">Login:</span>
                        <span className="font-black text-emerald-800">
                          {formatCount(loginInput !== "" ? loginInput : (todayEod ? todayEod.login : 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Copy WhatsApp Text Button */}
                  <div className="mt-4 pt-3 border-t border-emerald-200/70 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-700 font-medium">
                      {todayEod ? `Submitted at ${todayEod.submittedAt}` : "Ready to copy"}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy({
                          employeeName,
                          received: receivedInput !== "" ? receivedInput : (todayEod ? todayEod.received : 106),
                          appointment: appointmentInput !== "" ? appointmentInput : (todayEod ? todayEod.appointment : 0),
                          login: loginInput !== "" ? loginInput : (todayEod ? todayEod.login : 0)
                        })
                      }
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3 py-1.5 rounded-xl transition shadow-xs cursor-pointer"
                    >
                      {copiedId === (todayEod?.id || "current") ? (
                        <>
                          <Check size={13} />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy WhatsApp Text</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-slate-500 flex items-start gap-2">
                  <Sparkles size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    Your daily EOD counts are directly displayed in the <strong>Manager Dashboard</strong> with zero delay.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Previous EOD Submissions (History Section) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#162335] flex items-center gap-2">
                  <Clock size={18} className="text-[#162335]" />
                  Previous EOD Submissions
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Your daily submitted Received, Appointment, and Login history
                </p>
              </div>
              <span className="text-xs font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                {myHistory.length} Daily Records
              </span>
            </div>

            {myHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No previous submissions found. Submit today&apos;s EOD above!
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
                      <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myHistory.map((report) => (
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
                        <td className="py-3.5 px-4 text-xs font-black text-purple-700">
                          {formatCount(report.appointment)}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-black text-emerald-700">
                          {formatCount(report.login)}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-500">
                          {report.submittedAt || "-"}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-right">
                          <button
                            onClick={() => handleCopy(report)}
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
          2. MANAGER – DIRECT TEAM EOD MONITORING
          ======================================================== */}
      {activeView === "manager" && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-emerald-500">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                  Submitted
                </span>
                <UserCheck size={18} className="text-emerald-600" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1">
                {submittedCount} <span className="text-xs font-bold text-emerald-600">/ {dateStatusList.length}</span>
              </h3>
              <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                Team members submitted
              </p>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-amber-500">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800">
                  Not Submitted
                </span>
                <UserX size={18} className="text-amber-600" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-950 mt-1">
                {pendingCount}
              </h3>
              <p className="text-[11px] font-semibold text-amber-700 mt-0.5">
                Pending daily EOD
              </p>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-blue-600">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-800">
                  Total Received
                </span>
                <PhoneCall size={18} className="text-blue-600" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-blue-950 mt-1">
                {totalReceived}
              </h3>
              <p className="text-[11px] font-semibold text-blue-600 mt-0.5">
                Total leads handled
              </p>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-purple-600">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-800">
                  Appointments
                </span>
                <CalendarCheck size={18} className="text-purple-600" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-purple-950 mt-1">
                {formatCount(totalAppointment)}
              </h3>
              <p className="text-[11px] font-semibold text-purple-600 mt-0.5">
                Completed meetings
              </p>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-[#162335] col-span-2 md:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Loan Logins
                </span>
                <CheckCircle2 size={18} className="text-slate-600" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#162335] mt-1">
                {formatCount(totalLogin)}
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                Files logged in
              </p>
            </div>
          </div>

          {/* Mode Switcher: Date-wise vs Team-member-wise */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Organize By:
                </span>
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
                  <button
                    onClick={() => setManagerViewMode("date-wise")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                      managerViewMode === "date-wise"
                        ? "bg-[#162335] text-white shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Calendar size={13} />
                    <span>Date-wise Reports</span>
                  </button>
                  <button
                    onClick={() => setManagerViewMode("member-wise")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                      managerViewMode === "member-wise"
                        ? "bg-[#162335] text-white shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Users size={13} />
                    <span>Team-member-wise Reports</span>
                  </button>
                </div>
              </div>

              <button
                onClick={handleExportExcel}
                disabled={exporting || dateStatusList.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                title="Export this EOD table to Excel (.xlsx)"
              >
                <Download size={14} />
                <span>Export to Excel</span>
              </button>
            </div>

            {/* DATE-WISE MANAGER VIEW */}
            {managerViewMode === "date-wise" && (
              <div className="space-y-4">
                {/* Date Controls & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                      <Calendar size={13} /> Date:
                    </span>
                    <button
                      onClick={() => setSelectedDate(todayKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        selectedDate === todayKey
                          ? "bg-[#162335] text-white shadow-xs font-black"
                          : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      Today ({formatDisplayDate(todayKey)})
                    </button>
                    <button
                      onClick={() => setSelectedDate(yesterdayKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        selectedDate === yesterdayKey
                          ? "bg-[#162335] text-white shadow-xs font-black"
                          : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      Yesterday
                    </button>
                    <button
                      onClick={() => setSelectedDate(getDaysAgoDateKey(2))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        selectedDate === getDaysAgoDateKey(2)
                          ? "bg-[#162335] text-white shadow-xs font-black"
                          : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      {formatDisplayDate(getDaysAgoDateKey(2))}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex bg-white p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                      <button
                        onClick={() => setManagerStatusFilter("all")}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          managerStatusFilter === "all" ? "bg-slate-200 text-[#162335]" : "text-slate-500"
                        }`}
                      >
                        All ({dateStatusList.length})
                      </button>
                      <button
                        onClick={() => setManagerStatusFilter("submitted")}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          managerStatusFilter === "submitted" ? "bg-emerald-100 text-emerald-800" : "text-slate-500"
                        }`}
                      >
                        Submitted ({submittedCount})
                      </button>
                      <button
                        onClick={() => setManagerStatusFilter("pending")}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          managerStatusFilter === "pending" ? "bg-amber-100 text-amber-800" : "text-slate-500"
                        }`}
                      >
                        Not Submitted ({pendingCount})
                      </button>
                    </div>

                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search member..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white border border-slate-200 text-xs font-semibold rounded-xl pl-8 pr-3 py-1.5 w-36 focus:w-48 transition-all focus:outline-none focus:ring-1 focus:ring-[#162335]"
                      />
                    </div>
                  </div>
                </div>

                {/* Table displaying: Team Member Name, Date, Received, Appointment, Login, Status */}
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
                          Submission Status
                        </th>
                        <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                          WhatsApp Format
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDateList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                            No team members match this filter.
                          </td>
                        </tr>
                      ) : (
                        filteredDateList.map((item) => (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50/80 transition ${
                              !item.hasSubmitted ? "bg-amber-50/20" : ""
                            }`}
                          >
                            <td className="py-3.5 px-4 text-xs font-black text-[#162335] flex items-center gap-2">
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${
                                  item.hasSubmitted ? "bg-emerald-500" : "bg-amber-400"
                                }`}
                              />
                              <span>{item.employeeName}</span>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                              {item.displayDate}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-black">
                              {item.hasSubmitted ? (
                                <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-mono">
                                  {item.received}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-mono">-</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-black">
                              {item.hasSubmitted ? (
                                <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-mono">
                                  {formatCount(item.appointment)}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-mono">-</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-black">
                              {item.hasSubmitted ? (
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono">
                                  {formatCount(item.login)}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-mono">-</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs">
                              {item.hasSubmitted ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                                  <CheckCircle2 size={11} /> Submitted ({item.submittedAt})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                                  <AlertCircle size={11} /> Not Submitted
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-right">
                              {item.hasSubmitted ? (
                                <button
                                  onClick={() => handleCopy(item.reportObject)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-slate-600 font-bold transition text-xs"
                                  title="Copy WhatsApp text format"
                                >
                                  {copiedId === (item.reportObject?.id || item.employeeName) ? (
                                    <>
                                      <Check size={12} className="text-emerald-600" />
                                      <span className="text-emerald-600">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Pending</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TEAM-MEMBER-WISE MANAGER VIEW */}
            {managerViewMode === "member-wise" && (
              <div className="space-y-4">
                {/* Team member selection pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap mr-1">
                    Select Member:
                  </span>
                  {teamMembersList.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMember(member.name)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        selectedMember.toLowerCase() === member.name.toLowerCase()
                          ? "bg-[#162335] text-white shadow-xs font-black"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {member.name}
                    </button>
                  ))}
                </div>

                {/* Member Submissions List */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                    <div>
                      <h4 className="text-sm font-black text-[#162335]">
                        Daily EOD Trend: {selectedMember}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-400">
                        Chronological record of daily submissions
                      </p>
                    </div>
                    <span className="text-xs font-black bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                      {selectedMemberHistory.length} Days Recorded
                    </span>
                  </div>

                  {selectedMemberHistory.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No daily records found for {selectedMember}.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedMemberHistory.map((report) => (
                        <div
                          key={report.id}
                          className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs hover:shadow-md transition"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                            <span className="text-xs font-black text-[#162335]">
                              {report.displayDate || report.date}
                            </span>
                            <button
                              onClick={() => handleCopy(report)}
                              className="p-1 text-slate-400 hover:text-emerald-600 rounded transition"
                              title="Copy WhatsApp Format"
                            >
                              {copiedId === report.id ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>

                          <div className="font-mono text-xs space-y-1 text-slate-700">
                            <div className="flex items-center justify-between">
                              <span className="font-sans font-semibold text-slate-500">• Received:</span>
                              <span className="font-black text-blue-700 text-sm">{report.received}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-sans font-semibold text-slate-500">• Appointment:</span>
                              <span className="font-black text-purple-700 text-sm">{formatCount(report.appointment)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-sans font-semibold text-slate-500">• Login:</span>
                              <span className="font-black text-emerald-700 text-sm">{formatCount(report.login)}</span>
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{report.submittedAt || "Submitted"}</span>
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                              Submitted
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
