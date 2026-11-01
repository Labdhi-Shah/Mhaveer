import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FileSpreadsheet,
  Users,
  PhoneCall,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Search,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  UserCheck,
  UserX,
  Layers,
  ChevronRight
} from "lucide-react";
import {
  getStoredEodReports,
  getTodayDateKey,
  getYesterdayDateKey,
  getDaysAgoDateKey,
  formatDisplayDate,
  formatCount,
  formatWhatsAppText,
  getTeamEodStatusByDate,
  getAllTeamMembers,
  getEmployeeEodHistory
} from "../utils/eodStorage";

export default function ManagerEodSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const todayKey = getTodayDateKey();
  const yesterdayKey = getYesterdayDateKey();

  // View state: "date-wise" | "member-wise"
  const [viewMode, setViewMode] = useState("date-wise");
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [selectedMember, setSelectedMember] = useState("Shruti");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "submitted" | "pending"
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // Data states
  const [dateStatusList, setDateStatusList] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const refreshData = () => {
    const list = getTeamEodStatusByDate(selectedDate, user);
    setDateStatusList(list);
    const reports = getStoredEodReports();
    setAllReports(reports);
    const members = getAllTeamMembers(user);
    setTeamMembers(members);
  };

  useEffect(() => {
    refreshData();

    const handleUpdate = () => {
      refreshData();
    };

    window.addEventListener("mhaveer-eod-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("mhaveer-eod-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [selectedDate, user]);

  const handleCopy = (report) => {
    if (!report) return;
    const text = formatWhatsAppText(report);
    navigator.clipboard.writeText(text);
    setCopiedId(report.id || report.employeeName);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtered date-wise list
  const filteredDateList = dateStatusList.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "submitted"
        ? item.hasSubmitted
        : !item.hasSubmitted;
    return matchesSearch && matchesStatus;
  });

  // Calculate summary counts for selected date
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

  // Selected member history for member-wise view
  const memberHistory = getEmployeeEodHistory(selectedMember);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6 mb-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#162335] text-white rounded-2xl shadow-xs shrink-0">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg md:text-xl font-black text-[#162335]">
                Daily Team EOD Reports
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                Live Submissions
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Direct daily performance monitoring — track Received, Appointment, and Login numbers
            </p>
          </div>
        </div>

        {/* View Controls: Date-wise vs Team-member-wise Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
            <button
              onClick={() => setViewMode("date-wise")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === "date-wise"
                  ? "bg-[#162335] text-white shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar size={13} />
              <span>Date-wise</span>
            </button>
            <button
              onClick={() => setViewMode("member-wise")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === "member-wise"
                  ? "bg-[#162335] text-white shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users size={13} />
              <span>Team-member-wise</span>
            </button>
          </div>

          <button
            onClick={() => navigate("/eod")}
            className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-[#162335] rounded-xl text-xs font-black transition whitespace-nowrap"
            title="Open Full EOD Page"
          >
            <span>Full EOD Module</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Aggregate Metrics Bar for Current Selection */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {/* Submitted Count */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
              Submitted
            </span>
            <UserCheck size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-1">
            {submittedCount} <span className="text-xs font-bold text-emerald-700">/ {dateStatusList.length}</span>
          </div>
          <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
            Team members done
          </div>
        </div>

        {/* Pending Count */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800">
              Not Submitted
            </span>
            <UserX size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950 mt-1">
            {pendingCount}
          </div>
          <div className="text-[10px] font-bold text-amber-600 mt-0.5">
            Pending submissions
          </div>
        </div>

        {/* Total Leads Received */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-800">
              Total Received
            </span>
            <PhoneCall size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-950 mt-1">
            {totalReceived}
          </div>
          <div className="text-[10px] font-bold text-blue-600 mt-0.5">
            Leads received
          </div>
        </div>

        {/* Total Appointments */}
        <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-800">
              Appointments
            </span>
            <CalendarCheck size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-950 mt-1">
            {formatCount(totalAppointment)}
          </div>
          <div className="text-[10px] font-bold text-purple-600 mt-0.5">
            Completed meetings
          </div>
        </div>

        {/* Total Logins */}
        <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
              Loan Logins
            </span>
            <CheckCircle2 size={16} className="text-slate-600" />
          </div>
          <div className="text-2xl font-black text-[#162335] mt-1">
            {formatCount(totalLogin)}
          </div>
          <div className="text-[10px] font-bold text-slate-500 mt-0.5">
            Files logged in
          </div>
        </div>
      </div>

      {/* =========================================================
          MODE 1: DATE-WISE VIEW
          ========================================================= */}
      {viewMode === "date-wise" && (
        <div className="space-y-4">
          {/* Date Selector & Search Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            {/* Quick Date Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
                <Calendar size={13} /> Select Date:
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

            {/* Status Filter & Search */}
            <div className="flex items-center gap-2">
              <div className="flex bg-white p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    statusFilter === "all" ? "bg-slate-200 text-[#162335]" : "text-slate-500"
                  }`}
                >
                  All ({dateStatusList.length})
                </button>
                <button
                  onClick={() => setStatusFilter("submitted")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    statusFilter === "submitted" ? "bg-emerald-100 text-emerald-800" : "text-slate-500"
                  }`}
                >
                  Submitted ({submittedCount})
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    statusFilter === "pending" ? "bg-amber-100 text-amber-800" : "text-slate-500"
                  }`}
                >
                  Pending ({pendingCount})
                </button>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-slate-200 text-xs font-semibold rounded-xl pl-8 pr-3 py-1.5 w-32 focus:w-44 transition-all focus:outline-none focus:ring-1 focus:ring-[#162335]"
                />
              </div>
            </div>
          </div>

          {/* Date-wise Table showing exact required fields:
              Team Member Name, Date, Received, Appointment, Login, Status */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[650px]">
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
                    Status
                  </th>
                  <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                    WhatsApp Text
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDateList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                      No team members found for this criteria.
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
                        <span className={`w-2 h-2 rounded-full ${item.hasSubmitted ? "bg-emerald-500" : "bg-amber-400"}`} />
                        <span>{item.employeeName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-500">
                        {item.displayDate}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-black">
                        {item.hasSubmitted ? (
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            {item.received}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-black">
                        {item.hasSubmitted ? (
                          <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                            {formatCount(item.appointment)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-black">
                        {item.hasSubmitted ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {formatCount(item.login)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {item.hasSubmitted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 size={11} /> Submitted
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
                            title="Copy WhatsApp format"
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

      {/* =========================================================
          MODE 2: TEAM-MEMBER-WISE VIEW
          ========================================================= */}
      {viewMode === "member-wise" && (
        <div className="space-y-4">
          {/* Member Selection Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap mr-1">
              Select Member:
            </span>
            {teamMembers.map((member) => (
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

          {/* Member Performance Trend History */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
              <div>
                <h4 className="text-sm font-black text-[#162335]">
                  EOD History for {selectedMember}
                </h4>
                <p className="text-[11px] font-semibold text-slate-400">
                  Daily submissions tracked across dates
                </p>
              </div>
              <span className="text-xs font-black bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                {memberHistory.length} Days Recorded
              </span>
            </div>

            {memberHistory.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No past EOD submissions found for {selectedMember}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {memberHistory.map((report) => (
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
  );
}
