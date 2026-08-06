import { useEffect, useState, useCallback } from "react";
import { Users, ArrowRight, Loader2, ClipboardList, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function HRDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalEmployees: 0, activeEmployees: 0, inactiveEmployees: 0 });
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, empRes] = await Promise.all([
        api.get("/dashboard"),
        api.get("/employees?limit=5")
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (empRes.data.success) setRecentEmployees(empRes.data.data);
    } catch (err) {
      console.error("HR Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border-l-8 border-l-[#0a2540] text-center md:text-left">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#d4af37]">Human Resources Management</p>
          <h1 className="text-xl sm:text-2xl font-black text-[#0a2540] mt-1">HR Department Portal</h1>
        </div>
        <div className="text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 rounded-xl px-4 py-2">
          Location: <span className="font-bold text-[#0a2540]">Main Corporate Branch</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-[#0a2540] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wide">Total Employees</p>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0a2540] mt-1">{loading ? "..." : stats.totalEmployees}</h2>
          </div>
          <div className="w-12 h-12 bg-[#0a2540]/5 text-[#0a2540] rounded-2xl flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wide">Active Staff</p>
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{loading ? "..." : stats.activeEmployees}</h2>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-[#d4af37] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wide">Inactive Staff</p>
            <h2 className="text-2xl sm:text-3xl font-black text-[#d4af37] mt-1">{loading ? "..." : stats.inactiveEmployees}</h2>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-[#d4af37] border border-amber-100 rounded-2xl flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recently Joined Employees */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-[#0a2540]">Recently Joined Employees</h3>
            <button
              onClick={() => navigate("/hr/attendance")}
              className="text-xs text-[#0a2540] hover:text-[#d4af37] font-black flex items-center gap-1 w-fit"
            >
              Monitor Attendance <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-[#0a2540]" size={28} />
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead className="bg-[#0a2540] text-[#d4af37] font-extrabold uppercase whitespace-nowrap">
                  <tr>
                    <th className="py-3.5 px-4 rounded-l-xl">EMP ID</th>
                    <th className="py-3.5 px-4">NAME</th>
                    <th className="py-3.5 px-4">ROLE</th>
                    <th className="py-3.5 px-4 text-center rounded-r-xl">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
                  {recentEmployees.map((emp) => (
                    <tr key={emp._id || emp.employeeId} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-4 font-mono font-black text-[#0a2540]">{emp.employeeId}</td>
                      <td className="py-4 px-4 font-bold text-[#0a2540]">{emp.fullName}</td>
                      <td className="py-4 px-4 text-slate-500">{emp.role}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${emp.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-[#0a2540] mb-4">HR Controls & Shortcuts</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Use these options to manage company attendance records, review activity, and update staff information.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/hr/attendance")}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <ClipboardList size={18} className="text-[#d4af37]" />
                  <div>
                    <h4 className="text-xs font-black text-[#0a2540]">Attendance Logs</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Check clock-in times and break durations</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[#0a2540]" />
              </button>

              <button
                onClick={() => navigate("/hr/profile")}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-[#0a2540]" />
                  <div>
                    <h4 className="text-xs font-black text-[#0a2540]">My Profile</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">View and update your personal information</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[#0a2540]" />
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Mhaveer Fincap HR Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
