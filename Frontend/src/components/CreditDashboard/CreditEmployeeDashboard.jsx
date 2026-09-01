import { useState, useEffect } from "react";
import { FileText, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import api from "../../api";
import { useNavigate } from "react-router-dom";

export default function CreditEmployeeDashboard() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/credit/dashboard-stats");
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching credit stats:", error);
    }
  };

  const statCards = [
    { title: "Total Assigned", value: stats?.totalAssigned || 0, icon: <FileText size={24} className="text-blue-500" /> },
    { title: "New Loan Files", value: stats?.newFiles || 0, icon: <Clock size={24} className="text-yellow-500" /> },
    { title: "Pending Verification", value: stats?.pendingVer || 0, icon: <Clock size={24} className="text-orange-500" /> },
    { title: "Documents Pending", value: stats?.docsPending || 0, icon: <AlertCircle size={24} className="text-red-500" /> },
    { title: "Completed Verification", value: stats?.completedRev || 0, icon: <CheckCircle size={24} className="text-green-500" /> },
    { title: "Rejected", value: stats?.rejected || 0, icon: <XCircle size={24} className="text-red-500" /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-[#0a2540]">
        <p className="text-xs font-extrabold uppercase tracking-widest text-[#d4af37]">Credit Panel</p>
        <h1 className="text-xl sm:text-2xl font-black text-[#0a2540] mt-1">Employee Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-bold">{card.title}</p>
              <h3 className="text-3xl font-black text-[#0a2540] mt-1">{card.value}</h3>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">{card.icon}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={() => navigate("/credit/files")}
          className="bg-[#0a2540] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#d4af37] transition shadow-md"
        >
          View My Loan Files
        </button>
      </div>
    </div>
  );
}
