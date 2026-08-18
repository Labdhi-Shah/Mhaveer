import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Calendar, AlertCircle, CheckCircle, Loader2,
  RefreshCw, Target, TrendingUp, UserCheck, Phone, Clock,
  MapPin, ChevronDown, ChevronUp, BarChart3
} from "lucide-react";
import api from "../../api";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${String(d.getUTCDate()).padStart(2,"0")} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  } catch { return dateStr; }
};

const statusConfig = {
  Scheduled:   { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-500" },
  Completed:   { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  Cancelled:   { bg: "bg-rose-50",   text: "text-rose-700",   border: "border-rose-200",   dot: "bg-rose-500" },
  Rescheduled: { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-500" },
  Unassigned:  { bg: "bg-slate-100", text: "text-slate-600",  border: "border-slate-200",  dot: "bg-slate-400" },
};

export default function SalesManagerDashboard() {
  const [dashStats, setDashStats] = useState(null);
  const [meetings, setMeetings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);
  const [filterStatus, setFilterStatus]         = useState("All");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, meetingsRes] = await Promise.all([
        api.get("/meetings/sales-dashboard-stats"),
        api.get("/meetings"),
      ]);
      if (statsRes.data.success)   setDashStats(statsRes.data.data);
      if (meetingsRes.data.success) setMeetings(meetingsRes.data.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Filter meetings
  const filteredMeetings = meetings.filter((m) => {
    const statusMatch = filterStatus === "All" || m.status === filterStatus;
    return statusMatch;
  });

  const unassignedCount = dashStats?.unassignedCount ?? 0;

  return (
    <div className="space-y-6">
      {/* Toast */}
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
            {toast.type === "success"
              ? <CheckCircle size={20} className="text-emerald-600 shrink-0" />
              : <AlertCircle size={20} className="text-rose-600 shrink-0" />}
            <span className="text-sm font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-[#0a2540] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#d4af37]">Sales Portal</p>
          <h1 className="text-2xl font-black text-[#0a2540] mt-1">Sales Manager Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">Employee-wise meeting distribution overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 animate-pulse h-24" />
          ))}
        </div>
      ) : dashStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Total Assigned",
              value: dashStats.totalAssigned,
              sub: `of ${dashStats.totalCapacity} capacity`,
              color: "border-t-[#0a2540]",
              iconBg: "bg-blue-50 text-[#0a2540]",
              icon: <Target size={22} />,
            },
            {
              title: "Available Slots",
              value: dashStats.availableSlots,
              sub: "slots remaining",
              color: dashStats.availableSlots === 0 ? "border-t-rose-500" : "border-t-emerald-500",
              iconBg: dashStats.availableSlots === 0 ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-600",
              icon: <TrendingUp size={22} />,
            },
            {
              title: "Active Employees",
              value: dashStats.employees?.length ?? 0,
              sub: "Sales employees",
              color: "border-t-purple-500",
              iconBg: "bg-purple-50 text-purple-600",
              icon: <Users size={22} />,
            },
            {
              title: "Unassigned",
              value: dashStats.unassignedCount,
              sub: "pending meetings",
              color: dashStats.unassignedCount > 0 ? "border-t-rose-500" : "border-t-slate-300",
              iconBg: dashStats.unassignedCount > 0 ? "bg-rose-50 text-rose-500" : "bg-slate-50 text-slate-400",
              icon: <AlertCircle size={22} />,
            },
          ].map((card, i) => (
            <div
              key={i}
              className={`bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-t-4 ${card.color} flex items-center justify-between`}
            >
              <div>
                <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wide">{card.title}</p>
                <h2 className="text-2xl sm:text-3xl font-black text-[#0a2540] mt-1">{card.value}</h2>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{card.sub}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                {card.icon}
              </div>
            </div>
          ))}
        </div>
      )}



      {/* All Meetings Table with Filters */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-slate-100">
          <h3 className="text-md font-black text-[#0a2540] flex items-center gap-2">
            <Calendar size={18} className="text-[#d4af37]" />
            My Meetings
          </h3>
          <div className="flex flex-wrap gap-2">

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#0a2540]/20"
            >
              {["All","Scheduled","Completed","Cancelled","Rescheduled"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-[#0a2540]" size={28} />
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Calendar size={32} className="text-slate-300" />
            <p className="text-slate-400 font-bold text-sm">No meetings found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredMeetings.map((m, i) => {
              const sc = statusConfig[m.status] || statusConfig.Scheduled;
              return (
                <motion.div
                  key={m._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="p-4 sm:p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[#0a2540] font-black text-sm truncate">{m.customerName}</p>
                      <p className="text-slate-500 text-xs font-semibold mt-0.5">{m.title}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold">
                      {/* Assigned employee badge */}
                      <span className="flex items-center gap-1 bg-[#0a2540]/5 text-[#0a2540] px-2 py-1 rounded-lg font-bold">
                        <Users size={10} />
                        {m.salesAssignedToName || m.salesAssignedTo?.name || "Unassigned"}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar size={10} className="text-[#d4af37]" />
                        {formatDate(m.date)}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border ${sc.bg} ${sc.text} ${sc.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {m.status}
                      </span>
                      {m.salesAssignmentStatus === "Unassigned" && (
                        <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-lg font-black">
                          PENDING ASSIGNMENT
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
