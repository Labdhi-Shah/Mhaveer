import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { Calendar, CheckCircle, XCircle, Clock, Loader2, AlertCircle } from "lucide-react";

export default function LeaveManagement() {
  const { user } = useAuth();
  const [myLeaves, setMyLeaves] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({ startDate: "", endDate: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const isManagerOrAdmin = ["Manager", "Admin", "SuperAdmin"].includes(user?.role);

  const fetchMyLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get("/leaves/my-leaves");
      if (res.data.success) {
        setMyLeaves(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch my leaves", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get("/leaves/manager-leaves");
      if (res.data.success) {
        setTeamLeaves(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch team leaves", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
    if (isManagerOrAdmin) {
      fetchTeamLeaves();
    }
  }, [isManagerOrAdmin]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason) {
      showToast("All fields are required", "error");
      return;
    }
    
    if (new Date(form.startDate) > new Date(form.endDate)) {
      showToast("End date cannot be before start date", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/leaves/apply", form);
      if (res.data.success) {
        showToast("Leave applied successfully!", "success");
        setForm({ startDate: "", endDate: "", reason: "" });
        fetchMyLeaves();
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to apply leave", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.put(`/leaves/${id}/status`, { status });
      if (res.data.success) {
        showToast(`Leave ${status} successfully`, "success");
        fetchTeamLeaves();
      }
    } catch (error) {
      showToast("Failed to update status", "error");
    }
  };

  const showToast = (msg, type) => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case "Approved": return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">Approved</span>;
      case "Rejected": return <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded">Rejected</span>;
      default: return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">Pending</span>;
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded shadow-lg border ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
          {toast.message}
        </div>
      )}

      {/* Role Based Views */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Apply Leave Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <h3 className="text-lg font-black text-[#0a2540] mb-4">Apply for Leave</h3>
          <form onSubmit={handleApplyLeave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#d4af37]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#d4af37]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reason</label>
              <textarea rows={3} value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#d4af37]" placeholder="Why do you need leave?"></textarea>
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-[#d4af37] text-white font-black py-2.5 rounded-xl hover:bg-[#b5952f] transition flex justify-center items-center gap-2">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : "Submit Application"}
            </button>
          </form>
        </div>

        {/* My Leaves List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-black text-[#0a2540]">My Leave History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Dates</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Reason</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && !isManagerOrAdmin ? (
                  <tr><td colSpan={3} className="py-8 text-center text-slate-400 font-bold">Loading...</td></tr>
                ) : myLeaves.length === 0 ? (
                  <tr><td colSpan={3} className="py-8 text-center text-slate-400 font-bold">No leaves applied yet.</td></tr>
                ) : myLeaves.map((leave) => (
                  <tr key={leave._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-bold text-[#0a2540]">{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{leave.reason}</td>
                    <td className="py-3 px-4">{getStatusBadge(leave.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isManagerOrAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-black text-[#0a2540]">Team Leave Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Employee</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Dates</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Reason</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400 font-bold">Loading...</td></tr>
                ) : teamLeaves.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400 font-bold">No team leave requests.</td></tr>
                ) : teamLeaves.map((leave) => (
                  <tr key={leave._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-bold text-[#0a2540]">{leave.employeeName}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-slate-600">{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 max-w-[200px] truncate">{leave.reason}</td>
                    <td className="py-3 px-4">{getStatusBadge(leave.status)}</td>
                    <td className="py-3 px-4 flex gap-2">
                      {leave.status === "Pending" ? (
                        <>
                          <button onClick={() => handleUpdateStatus(leave._id, "Approved")} className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition" title="Approve">
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => handleUpdateStatus(leave._id, "Rejected")} className="p-1.5 bg-rose-100 text-rose-700 rounded hover:bg-rose-200 transition" title="Reject">
                            <XCircle size={16} />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
