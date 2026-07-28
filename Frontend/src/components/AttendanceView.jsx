import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, Download, Printer, Filter, ChevronDown, 
  Search, Eye, X, Loader2, AlertCircle, FileText, CheckCircle
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import * as XLSX from "xlsx";
import api from "../api";

export default function AttendanceView() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  
  // Filtering
  const [dateRange, setDateRange] = useState("This Month");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Modals
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch Stats and History
  const fetchAttendanceData = async (range, start, end) => {
    setLoading(true);
    try {
      const statsRes = await api.get("/attendance/stats");
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      let queryParams = "";
      if (range === "Custom" && start && end) {
        queryParams = `?startDate=${start}&endDate=${end}`;
      } else {
        const today = new Date();
        let s = new Date();
        let e = new Date();
        
        switch (range) {
          case "Today":
            s.setHours(0,0,0,0);
            queryParams = `?startDate=${s.toISOString()}&endDate=${e.toISOString()}`;
            break;
          case "Yesterday":
            s.setDate(s.getDate() - 1);
            s.setHours(0,0,0,0);
            e = new Date(s);
            e.setHours(23,59,59,999);
            queryParams = `?startDate=${s.toISOString()}&endDate=${e.toISOString()}`;
            break;
          case "This Week":
            s.setDate(s.getDate() - s.getDay() + 1);
            s.setHours(0,0,0,0);
            queryParams = `?startDate=${s.toISOString()}&endDate=${e.toISOString()}`;
            break;
          case "Last Week":
            s.setDate(s.getDate() - s.getDay() - 6);
            s.setHours(0,0,0,0);
            e = new Date(s);
            e.setDate(e.getDate() + 6);
            e.setHours(23,59,59,999);
            queryParams = `?startDate=${s.toISOString()}&endDate=${e.toISOString()}`;
            break;
          case "This Month":
            s = new Date(today.getFullYear(), today.getMonth(), 1);
            queryParams = `?startDate=${s.toISOString()}&endDate=${e.toISOString()}`;
            break;
          case "Last Month":
            s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            e = new Date(today.getFullYear(), today.getMonth(), 0, 23,59,59,999);
            queryParams = `?startDate=${s.toISOString()}&endDate=${e.toISOString()}`;
            break;
          default:
            s = new Date(today.getFullYear(), today.getMonth(), 1);
            queryParams = `?startDate=${s.toISOString()}&endDate=${e.toISOString()}`;
            break;
        }
      }

      const historyRes = await api.get(`/attendance/history${queryParams}`);
      if (historyRes.data.success) {
        setHistory(historyRes.data.data);
      }
    } catch (error) {
      console.error("Error fetching attendance data", error);
      showToast("Failed to load attendance records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData(dateRange, customStart, customEnd);
  }, [dateRange, customStart, customEnd]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Utility to determine status
  const getStatus = (record) => {
    if (!record.workingHours) return "Present"; // Assuming punched in but not out
    const [h, m] = record.workingHours.split(":").map(Number);
    const totalMinutes = h * 60 + m;
    if (totalMinutes >= 480) return "Present"; // 8 hours
    if (totalMinutes >= 240) return "Half Day"; // 4 hours
    return "Absent"; // Or Short Day
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Present": return "bg-emerald-100 text-emerald-800";
      case "Half Day": return "bg-amber-100 text-amber-800";
      case "Absent": return "bg-rose-100 text-rose-800";
      case "Holiday": return "bg-blue-100 text-blue-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  // Prepare chart data (Last 7 days for bar, month for area)
  const barChartData = history.slice(0, 7).reverse().map(r => {
    const [h, m] = (r.workingHours || "0:0").split(":").map(Number);
    return {
      date: new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short' }),
      hours: +(h + m/60).toFixed(2)
    };
  });

  const areaChartData = history.slice(0, 30).reverse().map(r => {
    const [h, m] = (r.workingHours || "0:0").split(":").map(Number);
    return {
      date: new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      hours: +(h + m/60).toFixed(2)
    };
  });

  // Filter history for search
  const filteredHistory = history.filter(h => 
    new Date(h.date).toLocaleDateString('en-IN').includes(searchTerm) ||
    (h.loginTime && new Date(h.loginTime).toLocaleTimeString('en-IN').includes(searchTerm))
  );

  // Pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredHistory.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredHistory.length / recordsPerPage);

  const handleExportExcel = () => {
    const exportData = history.map(r => ({
      Date: new Date(r.date).toLocaleDateString('en-IN'),
      "Login Time": r.loginTime ? new Date(r.loginTime).toLocaleTimeString('en-IN') : "N/A",
      "Logout Time": r.logoutTime ? new Date(r.logoutTime).toLocaleTimeString('en-IN') : "N/A",
      "Working Hours": r.workingHours || "N/A",
      Status: getStatus(r)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_History_${dateRange}.xlsx`);
    showToast("Excel downloaded successfully", "success");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-0 print:m-0 print:bg-white pb-10">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border print:hidden ${
              toast.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {toast.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Print Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-black text-[#0a2540]">Work History & Attendance</h2>
          <p className="text-sm text-slate-500 font-semibold mt-1">Track your daily login durations and statistics</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2.5 px-4 rounded-xl transition text-xs border border-emerald-200 shadow-sm">
            <Download size={16} /> Export Excel
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition text-xs border border-slate-200 shadow-sm">
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#0a2540]" size={40} /></div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Today's Time", value: stats?.todayWorkingTime || "00:00", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
              { label: "This Week", value: stats?.thisWeekWorkingTime || "00:00", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
              { label: "This Month", value: stats?.thisMonthWorkingTime || "00:00", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
              { label: "Last Month", value: stats?.lastMonthWorkingTime || "00:00", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
              { label: "Total Login Days", value: stats?.totalLoginDays || "0", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
              { label: "Total Hours", value: stats?.totalWorkingHours || "00:00", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" }
            ].map((card, i) => (
              <div key={i} className={`p-4 rounded-3xl border shadow-sm flex flex-col justify-center items-center text-center ${card.bg} ${card.border} print:border-none print:shadow-none print:bg-transparent`}>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">{card.label}</p>
                <p className={`text-xl font-black ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
            {/* Additional Stats */}
            <div className="lg:col-span-1 bg-[#0a2540] text-white p-6 rounded-3xl shadow-md border border-[#123659] flex flex-col gap-6">
              <h3 className="text-sm font-black text-[#d4af37] uppercase tracking-widest flex items-center gap-2">
                <FileText size={16} /> Advanced Statistics
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-xs font-bold text-slate-300">Avg. Daily Hours</span>
                  <span className="text-lg font-black text-white">{stats?.averageDailyHours || "00:00"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-xs font-bold text-slate-300">Longest Day</span>
                  <span className="text-lg font-black text-emerald-400">{stats?.longestWorkingDay || "00:00"}</span>
                </div>
                <div className="flex justify-between items-center pb-1">
                  <span className="text-xs font-bold text-slate-300">Shortest Day</span>
                  <span className="text-lg font-black text-rose-400">{stats?.shortestWorkingDay || "00:00"}</span>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-xs font-black text-slate-600 mb-4 uppercase tracking-wider">Weekly Working Hours</h3>
                <div className="flex-1 min-h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="hours" fill="#d4af37" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Area Chart */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-xs font-black text-slate-600 mb-4 uppercase tracking-wider">Monthly Trend</h3>
                <div className="flex-1 min-h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaChartData}>
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0a2540" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0a2540" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Area type="monotone" dataKey="hours" stroke="#0a2540" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Filter Bar & Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col print:border-none print:shadow-none print:bg-transparent">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-10 print:hidden">
              <div className="flex items-center gap-3 w-full sm:w-auto relative">
                <button 
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center justify-between gap-2 w-full sm:w-48 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  <span className="flex items-center gap-2"><Filter size={14} /> {dateRange}</span>
                  <ChevronDown size={14} />
                </button>

                <AnimatePresence>
                  {showFilterDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute top-12 left-0 w-48 bg-white border border-slate-200 shadow-xl rounded-xl py-2 z-20"
                    >
                      {["Today", "Yesterday", "This Week", "Last Week", "This Month", "Last Month", "Custom"].map(opt => (
                        <button 
                          key={opt}
                          onClick={() => { setDateRange(opt); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-xs font-bold transition ${dateRange === opt ? "bg-[#0a2540] text-white" : "text-slate-700 hover:bg-slate-100"}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {dateRange === "Custom" && (
                  <div className="flex items-center gap-2">
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none" />
                    <span className="text-slate-400 font-bold">-</span>
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none" />
                  </div>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search date or time..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-xs font-semibold outline-none focus:border-[#0a2540] transition"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-200 text-slate-400 font-black uppercase tracking-wider">
                    <th className="py-4 px-6 whitespace-nowrap">Date</th>
                    <th className="py-4 px-6 whitespace-nowrap">Login Time</th>
                    <th className="py-4 px-6 whitespace-nowrap">Logout Time</th>
                    <th className="py-4 px-6 whitespace-nowrap">Working Hrs</th>
                    <th className="py-4 px-6 whitespace-nowrap">Break Time</th>
                    <th className="py-4 px-6 whitespace-nowrap text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {currentRecords.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 font-bold">No records found for this period.</td>
                    </tr>
                  ) : (
                    currentRecords.map((record) => (
                      <tr 
                        key={record._id} 
                        onClick={() => setSelectedRecord(record)}
                        className="hover:bg-slate-50 transition cursor-pointer print:hover:bg-transparent"
                      >
                        <td className="py-4 px-6 font-black text-[#0a2540] whitespace-nowrap">
                          {new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-6 font-bold whitespace-nowrap">
                          {record.loginTime ? new Date(record.loginTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : "-"}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-500 whitespace-nowrap">
                          {record.logoutTime ? new Date(record.logoutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : "-"}
                        </td>
                        <td className="py-4 px-6 font-black text-emerald-600 whitespace-nowrap">
                          {record.workingHours || "-"}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-400 whitespace-nowrap">
                          {record.totalBreakTime || "00:00"}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(getStatus(record))}`}>
                            {getStatus(record)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between print:hidden">
                <span className="text-xs font-bold text-slate-400">
                  Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredHistory.length)} of {filteredHistory.length}
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-xs font-black transition flex items-center justify-center ${
                        currentPage === i + 1 ? "bg-[#0a2540] text-[#d4af37]" : "bg-slate-50 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Record Detail Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 print:hidden"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-lg font-black text-[#0a2540] flex items-center gap-2">
                  <Calendar size={20} className="text-[#d4af37]" />
                  Attendance Details
                </h3>
                <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-rose-500 transition">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-5 text-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Status</p>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(getStatus(selectedRecord))}`}>
                      {getStatus(selectedRecord)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Date</p>
                    <p className="font-black text-[#0a2540]">{new Date(selectedRecord.date).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Employee Name</p>
                    <p className="font-bold text-slate-800">{selectedRecord.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Employee ID</p>
                    <p className="font-mono font-bold text-slate-600">{selectedRecord.employeeId.substring(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Official Email</p>
                    <p className="font-bold text-slate-600 truncate">{selectedRecord.officialEmail}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Role / Branch</p>
                    <p className="font-bold text-slate-600">{selectedRecord.role} {selectedRecord.branch ? `- ${selectedRecord.branch}` : ""}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Punch In</p>
                    <p className="font-black text-blue-600">
                      {selectedRecord.loginTime ? new Date(selectedRecord.loginTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                    </p>
                  </div>
                  <div className="text-center border-x border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Punch Out</p>
                    <p className="font-black text-slate-600">
                      {selectedRecord.logoutTime ? new Date(selectedRecord.logoutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">Total Hrs</p>
                    <p className="font-black text-emerald-600">{selectedRecord.workingHours || "--:--"}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button onClick={() => setSelectedRecord(null)} className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-bold transition text-xs shadow-sm">
                  Close Details
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
