import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import {
  Clock, Calendar, User, Search, Filter, AlertCircle, ChevronLeft, ChevronRight, X, Activity, Briefcase, ClipboardList, CheckCircle, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getUserRoleCategory, filterAttendanceRecords } from "../utils/hierarchy";
import LeaveManagement from "./LeaveManagement";

export default function AttendanceView() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [mainTab, setMainTab] = useState("logs"); // "logs" or "leave"
  const [stats, setStats] = useState({
    today: "00:00",
    thisWeek: "00:00",
    lastWeek: "00:00",
    thisMonth: "00:00",
    lastMonth: "00:00",
    total: "00:00"
  });

  const [filterRange, setFilterRange] = useState("This Month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedRecord, setSelectedRecord] = useState(null);

  const processRecord = (r) => {
    const login = r.loginTime ? new Date(r.loginTime) : null;
    const logout = r.logoutTime ? new Date(r.logoutTime) : (login ? new Date() : null);
    const totalWorkingMinutes = login && logout ? Math.max(0, Math.floor((logout - login) / 60000)) : 0;
    const hours = Math.floor(totalWorkingMinutes / 60);
    const mins = totalWorkingMinutes % 60;
    return {
      ...r,
      totalWorkingMinutes,
      totalWorkingHours: `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`,
      status: r.logoutTime ? "Completed" : "Working"
    };
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const cat = getUserRoleCategory(user);
      if (cat === "Admin" || cat === "Employee") {
        const endpoint = cat === "Admin" ? "/attendance/admin" : "/attendance";
        const params = {
          page,
          limit: 10,
          range: filterRange !== "Custom" ? filterRange : undefined,
          startDate: filterRange === "Custom" ? customStart : undefined,
          endDate: filterRange === "Custom" ? customEnd : undefined,
          employeeName: searchTerm
        };

        const res = await api.get(endpoint, { params });
        if (res.data.success) {
          const processed = res.data.data.records.map(processRecord);
          setRecords(processed);
          setTotalPages(res.data.data.pages || 1);
          calculateStats(processed);
        }
      } else {
        const res = await api.get("/attendance/admin?limit=1000");
        if (res.data.success) {
          const allRecords = res.data.data.records.map(processRecord);
          
          let filtered = await filterAttendanceRecords(user, allRecords);

          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(r => 
              (r.employeeName || "").toLowerCase().includes(searchLower) ||
              (r.employeeId || "").toLowerCase().includes(searchLower)
            );
          }

          const now = new Date();
          const getStartOfDay = (date = new Date()) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d;
          };

          if (filterRange === "Today") {
            const todayStart = getStartOfDay();
            filtered = filtered.filter(r => new Date(r.date) >= todayStart);
          } else if (filterRange === "This Week") {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            const startOfWeek = new Date(now.setDate(diff));
            startOfWeek.setHours(0, 0, 0, 0);
            filtered = filtered.filter(r => new Date(r.date) >= startOfWeek);
          } else if (filterRange === "Last Week") {
            const day = now.getDay();
            const diff = now.getDate() - day - 6;
            const startOfLastWeek = new Date(now.setDate(diff));
            startOfLastWeek.setHours(0, 0, 0, 0);
            const endOfLastWeek = new Date(startOfLastWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(r => {
              const d = new Date(r.date);
              return d >= startOfLastWeek && d < endOfLastWeek;
            });
          } else if (filterRange === "This Month") {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            filtered = filtered.filter(r => new Date(r.date) >= startOfMonth);
          } else if (filterRange === "Last Month") {
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            filtered = filtered.filter(r => {
              const d = new Date(r.date);
              return d >= startOfLastMonth && d < endOfLastMonth;
            });
          } else if (filterRange === "Custom" && customStart && customEnd) {
            const start = new Date(customStart);
            const end = new Date(customEnd);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(r => {
              const d = new Date(r.date);
              return d >= start && d <= end;
            });
          }

          calculateStats(filtered);

          const limit = 10;
          const pages = Math.ceil(filtered.length / limit) || 1;
          setTotalPages(pages);

          const startIndex = (page - 1) * limit;
          const paginated = filtered.slice(startIndex, startIndex + limit);
          setRecords(paginated);
        }
      }
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const res = await api.get("/attendance/today");
      if (res.data.success && res.data.data) {
        setTodayRecord(res.data.data);
      } else {
        setTodayRecord(null);
      }
    } catch (error) {
      console.error("Failed to fetch today's attendance:", error);
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchTodayAttendance();
  }, [user, page, filterRange, searchTerm]);

  const handleAttendanceAction = async (action) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const endpoint = `/attendance/${action}`;
      const res = await api.post(endpoint);
      if (res.data.success) {
        setToast({ message: res.data.message || `Successfully ${action}ed!`, type: "success" });
        setTimeout(() => setToast(null), 3000);
        fetchTodayAttendance();
        fetchAttendance(); // Refresh records
      }
    } catch (error) {
      console.error(`Failed to ${action} attendance:`, error);
      setToast({ message: error.response?.data?.message || `Failed to ${action}`, type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const calculateStats = (data) => {
    // This is a naive calculation for the current fetched page. 
    // Ideally, stats should be computed backend-side. For this demo, we sum the records shown.
    let totalMins = 0;
    data.forEach(r => {
      totalMins += r.totalWorkingMinutes || 0;
    });

    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const formatted = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

    // We update all stats to the current dataset sum as a placeholder for actual backend stats
    setStats({
      today: filterRange === "Today" ? formatted : "00:00",
      thisWeek: filterRange === "This Week" ? formatted : "00:00",
      lastWeek: filterRange === "Last Week" ? formatted : "00:00",
      thisMonth: filterRange === "This Month" ? formatted : "00:00",
      lastMonth: filterRange === "Last Month" ? formatted : "00:00",
      total: formatted
    });
  };

  const handleApplyCustomDate = () => {
    if (customStart && customEnd) {
      setPage(1);
      fetchAttendance();
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "-";
    return new Date(isoStr).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric"
    });
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return "-";
    return new Date(isoStr).toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Working":
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">Working</span>;
      case "On Break":
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700">On Break</span>;
      case "Completed":
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">Completed</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500">{status || "-"}</span>;
    }
  };

  const chartData = records.slice(0, 7).map(r => ({
    name: formatDate(r.date).substring(0, 6),
    hours: (r.totalWorkingMinutes / 60).toFixed(1)
  })).reverse();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${
              toast.type === "success" 
                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="text-emerald-600 shrink-0" size={20} />
            ) : (
              <AlertCircle className="text-rose-600 shrink-0" size={20} />
            )}
            <span className="text-sm font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-[#0a2540] flex items-center gap-2">
            <ClipboardList className="text-[#d4af37]" /> Attendance & Leave
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Track work sessions or manage leave applications.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setMainTab("logs")} 
            className={`px-4 py-2 font-bold rounded-xl text-sm transition ${mainTab === 'logs' ? 'bg-[#0a2540] text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            Attendance Logs
          </button>
          <button 
            onClick={() => setMainTab("leave")} 
            className={`px-4 py-2 font-bold rounded-xl text-sm transition ${mainTab === 'leave' ? 'bg-[#0a2540] text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            Leave Management
          </button>
        </div>
      </div>

      {mainTab === "logs" ? (
        <>
          {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Today", value: stats.today, icon: <Clock size={16} /> },
          { label: "This Week", value: stats.thisWeek, icon: <Activity size={16} /> },
          { label: "Last Week", value: stats.lastWeek, icon: <Calendar size={16} /> },
          { label: "This Month", value: stats.thisMonth, icon: <Briefcase size={16} /> },
          { label: "Last Month", value: stats.lastMonth, icon: <Calendar size={16} /> },
          { label: "Total Working Time", value: stats.total, icon: <Activity size={16} />, highlight: true }
        ].map((card, idx) => (
          <div key={idx} className={`p-4 rounded-xl border ${card.highlight ? 'bg-[#0a2540] text-white border-[#0a2540] shadow-md' : 'bg-white text-slate-700 border-slate-200'} flex flex-col justify-center items-center text-center transition-all hover:scale-[1.02]`}>
            <div className={`p-2 rounded-full mb-2 ${card.highlight ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-slate-100 text-slate-500'}`}>
              {card.icon}
            </div>
            <p className={`text-[10px] font-extrabold uppercase tracking-wider ${card.highlight ? 'text-slate-300' : 'text-slate-500'}`}>{card.label}</p>
            <p className="text-lg font-black mt-1">{card.value} Hrs</p>
          </div>
        ))}
      </div>

      {/* CHART & FILTERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CHART SECTION */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-bold text-[#0a2540] mb-6 flex items-center gap-2">
            <Activity size={16} className="text-[#d4af37]" /> Working Hours Trend
          </h2>
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
                  <RechartsTooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="hours" name="Working Hours" fill="#0a2540" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm font-bold text-slate-400">
                No chart data available for selected range
              </div>
            )}
          </div>
        </div>

        {/* FILTERS SECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-[#0a2540] flex items-center gap-2">
            <Filter size={16} className="text-[#d4af37]" /> Filter Records
          </h2>

          <div className="space-y-3 flex-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Date Range</label>
            <select
              value={filterRange}
              onChange={(e) => setFilterRange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="Last Week">Last Week</option>
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="Custom">Custom Date Range</option>
            </select>

            {filterRange === "Custom" && (
              <div className="grid grid-cols-2 gap-2 mt-2 animate-in slide-in-from-top-2 duration-300">
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2.5"
                />
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2.5"
                />
                <button
                  onClick={handleApplyCustomDate}
                  className="col-span-2 mt-1 bg-[#0a2540] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#0a2540]/90 transition"
                >
                  Apply Custom Range
                </button>
              </div>
            )}

            {user?.role === "SuperAdmin" && (
              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Search Employee</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                {user?.role === "SuperAdmin" && (
                  <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee</th>
                )}
                <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Start Time</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">End Time</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Working</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm font-bold text-slate-400">Loading records...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm font-bold text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={24} className="text-slate-300" />
                      No attendance records found for this period.
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((r, i) => {
                  return (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedRecord(r)}>
                      <td className="py-4 px-6 text-sm font-bold text-[#0a2540]">{formatDate(r.date)}</td>
                      {user?.role === "SuperAdmin" && (
                        <td className="py-4 px-6 text-sm font-semibold text-slate-600">{r.employeeName}</td>
                      )}
                      <td className="py-4 px-6 text-sm font-semibold text-emerald-600">{formatTime(r.loginTime)}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-rose-500">{formatTime(r.logoutTime)}</td>
                      <td className="py-4 px-6 text-sm font-black text-[#0a2540]">{r.totalWorkingHours}</td>
                      <td className="py-4 px-6">{getStatusBadge(r.status)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:text-[#0a2540] disabled:opacity-50 transition bg-transparent"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:text-[#0a2540] disabled:opacity-50 transition bg-transparent"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      <AnimatePresence>
        {selectedRecord && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="bg-[#0a2540] p-6 relative">
                <button onClick={() => setSelectedRecord(null)} className="absolute top-4 right-4 text-white/50 hover:text-white transition">
                  <X size={20} />
                </button>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#d4af37] mb-4">
                  <User size={24} />
                </div>
                <h3 className="text-xl font-black text-white">{selectedRecord.employeeName}</h3>
                <p className="text-xs font-bold text-[#d4af37] uppercase tracking-widest mt-1">
                  ID: {selectedRecord.employeeId?.toString().substring(0, 8) || "N/A"}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</span>
                  <span className="text-sm font-black text-[#0a2540]">{formatDate(selectedRecord.date)}</span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Start Time</span>
                  <span className="text-sm font-bold text-emerald-600">{formatTime(selectedRecord.loginTime)}</span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">End Time</span>
                  <span className="text-sm font-bold text-rose-500">{formatTime(selectedRecord.logoutTime)}</span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-black text-[#0a2540] uppercase tracking-widest">Total Working Time</span>
                  <span className="text-xl font-black text-[#0a2540]">{selectedRecord.totalWorkingHours}</span>
                </div>

                <div className="mt-6 flex justify-end">
                  {getStatusBadge(selectedRecord.status)}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
        </>
      ) : (
        <LeaveManagement />
      )}
    </div>
  );
}