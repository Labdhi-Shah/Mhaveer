import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileSpreadsheet,
  Users,
  PhoneCall,
  CalendarCheck,
  CheckCircle2,
  Copy,
  Check,
  Search,
  ExternalLink,
  Clock,
  ArrowRight
} from "lucide-react";
import {
  getStoredEodReports,
  getTodayDateKey,
  formatCount,
  formatWhatsAppText
} from "../utils/eodStorage";

export default function ManagerEodSection({ compact = false }) {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [selectedDate, setSelectedDate] = useState("today");

  const todayKey = getTodayDateKey();

  const loadReports = () => {
    const all = getStoredEodReports();
    setReports(all);
  };

  useEffect(() => {
    loadReports();

    const handleUpdate = () => {
      loadReports();
    };

    window.addEventListener("mhaveer-eod-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("mhaveer-eod-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const handleCopy = (report) => {
    const text = formatWhatsAppText(report);
    navigator.clipboard.writeText(text);
    setCopiedId(report.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter reports
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      !searchTerm ||
      r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = selectedDate === "all" ? true : r.date === todayKey;
    return matchesSearch && matchesDate;
  });

  // Calculate totals
  const totalReceived = filteredReports.reduce((acc, curr) => acc + (Number(curr.received) || 0), 0);
  const totalAppointment = filteredReports.reduce((acc, curr) => acc + (Number(curr.appointment) || 0), 0);
  const totalLogin = filteredReports.reduce((acc, curr) => acc + (Number(curr.login) || 0), 0);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6 mb-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileSpreadsheet size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-black text-[#162335]">
                  Team EOD (End of Day) Reports
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  Daily Performance
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Daily Received, Appointment, and Loan Login submissions from Telecalling team members
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSelectedDate("today")}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedDate === "today"
                  ? "bg-[#162335] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate("all")}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedDate === "all"
                  ? "bg-[#162335] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Records
            </button>
          </div>

          <button
            onClick={() => navigate("/eod")}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#162335] rounded-xl text-xs font-black transition"
            title="Open Dedicated EOD Module"
          >
            <span>View Full Module</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Active Reports
            </span>
            <Users size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-black text-[#162335] mt-1.5">
            {filteredReports.length}
          </div>
          <div className="text-[10px] font-bold text-slate-400 mt-0.5">
            Team submissions
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
              Total Received
            </span>
            <PhoneCall size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-900 mt-1.5">
            {totalReceived}
          </div>
          <div className="text-[10px] font-bold text-blue-600/80 mt-0.5">
            Total leads handled
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
              Total Appointments
            </span>
            <CalendarCheck size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1.5">
            {formatCount(totalAppointment)}
          </div>
          <div className="text-[10px] font-bold text-amber-600/80 mt-0.5">
            Appointments booked
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
              Total Logins
            </span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1.5">
            {formatCount(totalLogin)}
          </div>
          <div className="text-[10px] font-bold text-emerald-600/80 mt-0.5">
            Loan apps logged in
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by team member name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#162335]/20"
          />
        </div>
      </div>

      {/* WhatsApp Reference Cards Grid */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Users size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-600">No EOD reports found</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchTerm ? "No team members matching your search query." : "No reports have been submitted for this date range yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition group relative flex flex-col justify-between"
            >
              <div>
                {/* Header with Name & Copy */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 mb-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Team Member
                    </span>
                    <h3 className="text-sm font-black text-[#162335]">
                      {report.employeeName}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleCopy(report)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                    title="Copy WhatsApp Format"
                  >
                    {copiedId === report.id ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                        <Check size={12} /> Copied
                      </span>
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>

                {/* WhatsApp Reference Content Box */}
                <div className="bg-[#f0f4f9]/80 border border-slate-200/80 rounded-xl p-3 font-mono text-xs text-slate-800 space-y-1">
                  <div className="font-sans font-bold text-[11px] text-slate-500 mb-1 border-b border-slate-200 pb-1 flex items-center justify-between">
                    <span>EOD Format</span>
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

              {/* Card Footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {report.submittedAt || "Submitted"}
                </span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

