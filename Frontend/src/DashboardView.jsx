import { useEffect, useState, useCallback } from "react";
import { Users, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "./api";
export default function DashboardView({ onOpenForm }) {
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
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border-l-8 border-l-[#162335] text-center md:text-left">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#9ca3af]">Executive Overview</p>
          <h1 className="text-xl sm:text-2xl font-black text-[#162335]">Super Admin Dashboard</h1>
        </div>
        <button
          onClick={onOpenForm || (() => navigate("/add-employee"))}
          className="bg-[#9ca3af] hover:bg-[#c39e2d] text-[#162335] px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-md whitespace-nowrap"
        >
          Add New Employee
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-[#162335] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-extrabold uppercase">TOTAL EMPLOYEES</p>
            <h2 className="text-2xl sm:text-3xl font-black text-[#162335] mt-1">{loading ? "..." : stats.totalEmployees}</h2>
          </div>
          <div className="w-12 h-12 bg-[#162335] text-white rounded-2xl flex items-center justify-center shrink-0"><Users size={22} /></div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-[#9ca3af] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-extrabold uppercase">ACTIVE EMPLOYEES</p>
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{loading ? "..." : stats.activeEmployees}</h2>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl flex items-center justify-center shrink-0"><Users size={22} /></div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-rose-500 flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-slate-400 text-[10px] font-extrabold uppercase">INACTIVE EMPLOYEES</p>
            <h2 className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">{loading ? "..." : stats.inactiveEmployees}</h2>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl flex items-center justify-center shrink-0"><Users size={22} /></div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <h3 className="text-lg font-black text-[#162335]">Recently Joined Employees</h3>
          <button onClick={() => navigate("/employees")} className="text-xs text-[#162335] hover:text-[#9ca3af] font-black flex items-center gap-1 w-fit">
            View All <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#162335]" size={28} /></div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-[#162335] text-white font-extrabold uppercase whitespace-nowrap">
                <tr>
                  <th className="py-3.5 px-4 rounded-l-xl">EMP ID</th>
                  <th className="py-3.5 px-4">NAME</th>
                  <th className="py-3.5 px-4">ROLE</th>
                  <th className="py-3.5 px-4 text-center rounded-r-xl">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
                {recentEmployees.map((emp) => (
                  <tr key={emp._id || emp.employeeId} className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-mono font-black text-[#162335]">{emp.employeeId}</td>
                    <td className="py-4 px-4 font-bold text-[#162335]">{emp.fullName}</td>
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
    </div>
  );
}