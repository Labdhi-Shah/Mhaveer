import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Phone, MapPin, Clock, CheckCircle, AlertCircle,
  Loader2, User, TrendingUp, Target, Award, ClipboardList,
  X, CalendarClock
} from "lucide-react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import FillFormModal from "../FillFormModal";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${String(d.getUTCDate()).padStart(2, "0")} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  } catch { return dateStr; }
};

const formatTime = (timeStr) => {
  if (!timeStr) return "—";
  const hhmm = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    let hh = parseInt(hhmm[1], 10);
    const mm = hhmm[2];
    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12 || 12;
    return `${hh}:${mm} ${ampm}`;
  }
  return timeStr;
};

const statusConfig = {
  Scheduled: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  Completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  Cancelled: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
  Rescheduled: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
};

export default function SalesEmployeeDashboard() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");

  // Fill Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  // Reschedule modal
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ date: "", time: "" });
  const [selectedRescheduleMeeting, setSelectedRescheduleMeeting] = useState(null);

  const handleOpenReschedule = (meeting) => {
    setSelectedRescheduleMeeting(meeting);
    setRescheduleData({ date: "", time: "" });
    setIsRescheduleOpen(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleData.date || !rescheduleData.time) {
      showToast("Please select both a new date and time.", "error");
      return;
    }
    try {
      const payload = {
        date: rescheduleData.date,
        time: rescheduleData.time,
        status: "Rescheduled"
      };
      const res = await api.put(`/meetings/${selectedRescheduleMeeting._id}`, payload);
      if (res.data.success) {
        showToast("Meeting rescheduled successfully.");
        setIsRescheduleOpen(false);
        setSelectedRescheduleMeeting(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to reschedule meeting.", "error");
    }
  };

  const handleFillForm = (meeting) => {
    if (!["Scheduled", "Rescheduled"].includes(meeting.status)) {
      showToast("Only scheduled or rescheduled meetings can be filled.", "error");
      return;
    }
    setSelectedMeeting(meeting);
    setIsFormOpen(true);
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await api.put(`/meetings/${id}`, { status });
      if (res.data.success) {
        showToast(`Meeting marked as ${status}.`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to update status.", "error");
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setStatsLoading(true);

      const [meetingsRes, statsRes] = await Promise.all([
        api.get("/meetings"),
        api.get("/meetings/sales-employee-stats"),
      ]);

      if (meetingsRes.data.success) setMeetings(meetingsRes.data.data);
      if (statsRes.data.success) setStats(statsRes.data.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load dashboard data.", "error");
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredMeetings = filterStatus === "All"
    ? meetings
    : meetings.filter((m) => m.status === filterStatus);

  const capacityPercent = stats
    ? Math.round((stats.assignedCount / stats.maxCapacity) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${toast.type === "success"
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
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-[#0a2540]">
        <p className="text-xs font-extrabold uppercase tracking-widest text-[#d4af37]">Sales Portal</p>
        <h1 className="text-2xl font-black text-[#0a2540] mt-1">My Meetings</h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Welcome back, <span className="text-[#0a2540] font-bold">{user?.name || user?.fullName}</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Assigned Meetings",
            value: statsLoading ? null : stats?.assignedCount ?? 0,
            sub: `of ${stats?.maxCapacity ?? 30} max`,
            color: "border-t-[#0a2540]",
            iconBg: "bg-blue-50 text-[#0a2540]",
            icon: <Target size={22} />,
          },
          {
            title: "Remaining Capacity",
            value: statsLoading ? null : stats?.remainingCapacity ?? 30,
            sub: "slots available",
            color: stats?.remainingCapacity === 0 ? "border-t-rose-500" : "border-t-emerald-500",
            iconBg: stats?.remainingCapacity === 0 ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-600",
            icon: <TrendingUp size={22} />,
          },
          {
            title: "Today's Meetings",
            value: statsLoading ? null : stats?.todaysMeetings ?? 0,
            sub: "scheduled today",
            color: "border-t-purple-500",
            iconBg: "bg-purple-50 text-purple-600",
            icon: <Calendar size={22} />,
          },
          {
            title: "Completed",
            value: statsLoading ? null : stats?.completedMeetings ?? 0,
            sub: "meetings done",
            color: "border-t-[#d4af37]",
            iconBg: "bg-amber-50 text-[#d4af37]",
            icon: <Award size={22} />,
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-t-4 ${card.color} flex items-center justify-between`}
          >
            <div>
              <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wide">{card.title}</p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0a2540] mt-1">
                {card.value === null
                  ? <Loader2 className="animate-spin text-slate-300" size={24} />
                  : card.value}
              </h2>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{card.sub}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Capacity Bar */}
      {!statsLoading && stats && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Meeting Capacity</p>
              <p className="text-[#0a2540] font-black text-lg mt-0.5">
                {stats.assignedCount} / {stats.maxCapacity} Meetings
              </p>
            </div>
            <span className={`text-xs font-black px-3 py-1.5 rounded-full ${stats.isFull ?? stats.remainingCapacity === 0
                ? "bg-rose-100 text-rose-700"
                : "bg-emerald-100 text-emerald-700"
              }`}>
              {stats.remainingCapacity === 0 ? "FULL" : `${stats.remainingCapacity} remaining`}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-700 ${capacityPercent >= 100
                  ? "bg-rose-500"
                  : capacityPercent >= 70
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-2">{capacityPercent}% capacity used</p>
        </div>
      )}

      {/* Filter + Meetings List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-slate-100">
          <h3 className="text-md font-black text-[#0a2540] flex items-center gap-2">
            <Calendar size={18} className="text-[#d4af37]" />
            My Assigned Meetings
          </h3>
          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {["All", "Scheduled", "Completed", "Cancelled", "Rescheduled"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition ${filterStatus === s
                    ? "bg-[#0a2540] text-[#d4af37]"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="animate-spin text-[#0a2540]" size={32} />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Loading meetings…</p>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Calendar size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-400 font-bold text-sm">No meetings found</p>
            <p className="text-slate-300 text-xs">
              {filterStatus !== "All" ? `No ${filterStatus} meetings` : "No meetings assigned to you yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredMeetings.map((meeting, i) => {
              const sc = statusConfig[meeting.status] || statusConfig.Scheduled;
              return (
                <motion.div
                  key={meeting._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-4 sm:p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Main Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#0a2540]/5 flex items-center justify-center shrink-0 mt-0.5">
                        <User size={18} className="text-[#0a2540]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#0a2540] font-black text-sm truncate">{meeting.title}</p>
                        <p className="text-slate-500 font-semibold text-xs mt-0.5">{meeting.customerName}</p>
                        {meeting.customerPhone && (
                          <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                            <Phone size={10} />
                            {meeting.customerPhone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Middle: Date / Time / Location */}
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-[#d4af37]" />
                        {formatDate(meeting.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-[#d4af37]" />
                        {formatTime(meeting.time)}
                      </span>
                      {meeting.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          <span className="truncate max-w-[120px]">{meeting.location}</span>
                        </span>
                      )}
                    </div>

                    {/* Right: Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide border ${sc.bg} ${sc.text} ${sc.border} shrink-0`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {meeting.status}
                    </span>
                  </div>

                  {/* Lead info if available */}
                  {meeting.leadId && (
                    <div className="mt-3 ml-13 pl-13 sm:pl-[52px] text-[10px] text-slate-400 font-semibold flex items-center gap-2">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-lg">
                        Lead: {meeting.leadId.companyName || meeting.leadId.contactPerson || "Linked Lead"}
                      </span>
                      {meeting.leadId.loanType && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-lg">{meeting.leadId.loanType}</span>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {meeting.notes && (
                    <p className="mt-2 text-[10px] text-slate-400 pl-[52px] italic line-clamp-2">
                      {meeting.notes}
                    </p>
                  )}

                  {/* Action Row */}
                  <div
                    className="border-t border-slate-100 pt-3 mt-3 flex items-center gap-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {["Scheduled", "Rescheduled"].includes(meeting.status) ? (
                      <div className="flex items-center gap-3 w-full justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleFillForm(meeting)}
                            className="px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 bg-[#0a2540] hover:bg-[#0a2540]/90 text-[#d4af37]"
                          >
                            <ClipboardList size={13} />
                            Fill Form
                          </button>
                          <button
                            onClick={() => handleOpenReschedule(meeting)}
                            className="px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                          >
                            <CalendarClock size={13} />
                            Reschedule
                          </button>
                        </div>
                        <button
                          onClick={() => updateStatus(meeting._id, "Cancelled")}
                          className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                          title="Cancel Meeting"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : meeting.status === "Completed" ? (
                      <div className="px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <CheckCircle size={13} />
                        Form Submitted
                      </div>
                    ) : (
                      <div className="px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 bg-slate-100 text-slate-400 border border-slate-200">
                        {meeting.status}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fill Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <FillFormModal
            isOpen={isFormOpen}
            onClose={(wasSubmitted) => { 
              setIsFormOpen(false); 
              setSelectedMeeting(null); 
              if (wasSubmitted) fetchData();
            }}
            selectedMeeting={selectedMeeting}
          />
        )}
      </AnimatePresence>

      {/* Reschedule Modal */}
      <AnimatePresence>
        {isRescheduleOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="bg-[#0a2540] p-5">
                <h3 className="text-[#d4af37] font-black text-lg flex items-center gap-2">
                  <CalendarClock size={20} />
                  Reschedule Meeting
                </h3>
                <p className="text-slate-300 text-xs mt-1">Select a new date and time</p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0a2540] mb-1.5">New Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    value={rescheduleData.date}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0a2540]/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0a2540] mb-1.5">New Time <span className="text-rose-500">*</span></label>
                  <input
                    type="time"
                    value={rescheduleData.time}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0a2540]/20"
                    required
                  />
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => setIsRescheduleOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRescheduleSubmit}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-[#0a2540] text-[#d4af37] hover:bg-[#0a2540]/90 transition"
                >
                  Save Reschedule
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}