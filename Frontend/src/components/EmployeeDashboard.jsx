import { useState, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, Calendar, Clock, DollarSign, Award, Briefcase, User, 
  MapPin, CheckCircle, AlertCircle, Loader2, ArrowRight, Eye, Edit2, Trash2 
} from "lucide-react";
import api from "../api";

export default function EmployeeDashboard() {
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    todayCalls: 0,
    interestedLeads: 0,
    pendingFollowups: 0,
    todayMeetings: 0
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals for Actions
  const [viewLead, setViewLead] = useState(null);
  const [editLead, setEditLead] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Show toast utility
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Dashboard Stats and Recent Leads
  const fetchData = async () => {
    try {
      setStatsLoading(true);
      setRecentLoading(true);
      
      const [statsRes, leadsRes] = await Promise.all([
        api.get("/leads/stats"),
        api.get("/leads?limit=5")
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (leadsRes.data.success) {
        setRecentLeads(leadsRes.data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      showToast(error.response?.data?.message || "Failed to load dashboard data.", "error");
    } finally {
      setStatsLoading(false);
      setRecentLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  // Handle Delete Lead
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await api.delete(`/leads/${deleteConfirm}`);
      if (res.data.success) {
        showToast("Lead deleted successfully!", "success");
        setDeleteConfirm(null);
        fetchData();
      }
    } catch (error) {
      showToast("Failed to delete lead.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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

      {/* Top Welcome Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border-l-8 border-l-[#0a2540]">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#d4af37]">Reception & Front Desk</p>
          <h1 className="text-xl sm:text-2xl font-black text-[#0a2540] mt-1">Lead Management CRM Dashboard</h1>
        </div>
        <div className="text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 rounded-xl px-4 py-2">
          Logged in location: <span className="font-bold text-[#0a2540]">Main Corporate Branch</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Today's Calls", value: stats.todayCalls || 0, color: "border-t-[#0a2540]", iconBg: "bg-blue-50 text-[#0a2540]", icon: <Phone size={22} /> },
          { title: "Interested Leads", value: stats.interestedLeads || 0, color: "border-t-emerald-500", iconBg: "bg-emerald-50 text-emerald-600", icon: <Award size={22} /> },
          { title: "Pending Follow-ups", value: stats.pendingFollowups || 0, color: "border-t-[#d4af37]", iconBg: "bg-amber-50 text-[#d4af37]", icon: <Clock size={22} /> },
          { title: "Today's Meetings", value: stats.todayMeetings || 0, color: "border-t-purple-500", iconBg: "bg-purple-50 text-purple-600", icon: <Calendar size={22} /> }
        ].map((card, idx) => (
          <div key={idx} className={`bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-t-4 ${card.color} flex items-center justify-between`}>
            <div>
              <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wide">{card.title}</p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0a2540] mt-1">
                {statsLoading ? (
                  <Loader2 className="animate-spin text-slate-300" size={24} />
                ) : (
                  card.value
                )}
              </h2>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Leads Panel */}
      <div className="w-full">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between h-fit">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-md font-black text-[#0a2540] flex items-center gap-2">
                <CheckCircle size={18} className="text-emerald-500" />
                Recent CRM Actions
              </h3>
            </div>

            {recentLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="animate-spin text-[#0a2540]" size={28} />
                <p className="text-[10px] text-slate-400 font-bold uppercase">Retrieving Leads...</p>
              </div>
            ) : recentLeads.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No recent leads created. Use the form to save leads.
              </div>
            ) : (
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <div key={lead._id} className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl flex flex-col gap-2 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-black text-slate-400">{lead.leadId}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                        lead.interested === "Yes" ? "bg-emerald-100 text-emerald-800" :
                        lead.interested === "No" ? "bg-rose-100 text-rose-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {lead.interested}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#0a2540] truncate">{lead.companyName}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Contact: {lead.contactPerson}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100/70 pt-2 mt-1">
                      <span className="text-[10px] font-extrabold text-[#d4af37]">{lead.loanType}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setViewLead(lead)} 
                          className="p-1 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg text-slate-500 hover:text-[#0a2540] transition"
                          title="Quick View"
                        >
                          <Eye size={12} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm(lead._id)}
                          className="p-1 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg text-slate-400 hover:text-rose-600 transition"
                          title="Delete Lead"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Leads Detailed Table at the Bottom */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden">
        <h3 className="text-lg font-black text-[#0a2540] mb-5">Latest Leads Log</h3>
        
        {recentLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#0a2540]" size={28} /></div>
        ) : recentLeads.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">No leads logged.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0a2540] text-[#d4af37] font-extrabold uppercase whitespace-nowrap">
                  <th className="py-3 px-4 rounded-l-xl">LEAD ID</th>
                  <th className="py-3 px-4">COMPANY NAME</th>
                  <th className="py-3 px-4">CONTACT PERSON</th>
                  <th className="py-3 px-4">PHONE NUMBER</th>
                  <th className="py-3 px-4">LOAN TYPE</th>
                  <th className="py-3 px-4 text-center">CIBIL</th>
                  <th className="py-3 px-4 text-center">INTERESTED</th>
                  <th className="py-3 px-4 text-center">CALL STATUS</th>
                  <th className="py-3 px-4 text-center">MEETING</th>
                  <th className="py-3 px-4 text-center">FOLLOW-UP</th>
                  <th className="py-3 px-4 text-center rounded-r-xl">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
                {recentLeads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-black text-[#0a2540]">{lead.leadId}</td>
                    <td className="py-3.5 px-4 font-bold text-[#0a2540]">{lead.companyName}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{lead.contactPerson}</td>
                    <td className="py-3.5 px-4 text-slate-600">{lead.phone}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-500">{lead.loanType}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        lead.cibilScore >= 750 ? "bg-emerald-50 text-emerald-700" :
                        lead.cibilScore >= 650 ? "bg-amber-50 text-amber-700" :
                        "bg-rose-50 text-rose-700"
                      }`}>
                        {lead.cibilScore}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black ${
                        lead.interested === "Yes" ? "bg-emerald-100 text-emerald-800" :
                        lead.interested === "No" ? "bg-rose-100 text-rose-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {lead.interested}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-600">{lead.callStatus}</td>
                    <td className="py-3.5 px-4 text-center text-slate-500">
                      {lead.meetingDate ? `${lead.meetingDate} ${lead.meetingTime || ""}` : "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500">
                      {lead.followUpDate ? `${lead.followUpDate} ${lead.followUpTime || ""}` : "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button 
                          onClick={() => setViewLead(lead)}
                          className="p-1 text-slate-400 hover:text-[#0a2540] hover:bg-slate-100 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm(lead._id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                          title="Delete Lead"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modals */}
      {/* 1. View Lead Details Modal */}
      {viewLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full max-h-[85vh] overflow-y-auto border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#0a2540]">Lead Profile: {viewLead.leadId}</h3>
              <button onClick={() => setViewLead(null)} className="text-slate-400 hover:text-[#0a2540] font-black text-sm">✕</button>
            </div>
            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-50 pb-4">
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Company Name</p>
                  <p className="font-black text-sm text-[#0a2540] mt-1">{viewLead.companyName}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Contact Person</p>
                  <p className="font-black text-sm text-[#0a2540] mt-1">{viewLead.contactPerson}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b border-slate-50 pb-4">
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Phone Number</p>
                  <p className="font-bold text-slate-800 mt-1">{viewLead.phone}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Location</p>
                  <p className="font-bold text-slate-800 mt-1">{viewLead.city ? `${viewLead.city}, ${viewLead.state || ""}` : "N/A"}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-slate-50 pb-4">
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Yearly Income</p>
                  <p className="font-black text-slate-800 mt-1">₹{viewLead.yearlyIncome?.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Loan Required</p>
                  <p className="font-black text-emerald-600 mt-1">₹{viewLead.loanAmount?.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">CIBIL Score</p>
                  <p className="font-black text-slate-800 mt-1">{viewLead.cibilScore}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b border-slate-50 pb-4">
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Interested Status</p>
                  <p className="font-bold mt-1 text-slate-800">{viewLead.interested}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Call Status</p>
                  <p className="font-bold mt-1 text-slate-800">{viewLead.callStatus}</p>
                </div>
              </div>
              {(viewLead.meetingDate || viewLead.followUpDate) && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                  {viewLead.meetingDate && (
                    <div>
                      <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Meeting Schedule</p>
                      <p className="font-bold text-[#0a2540] mt-1">{viewLead.meetingDate} at {viewLead.meetingTime || "N/A"}</p>
                    </div>
                  )}
                  {viewLead.followUpDate && (
                    <div>
                      <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Follow-up Schedule</p>
                      <p className="font-bold text-[#d4af37] mt-1">{viewLead.followUpDate} at {viewLead.followUpTime || "N/A"}</p>
                    </div>
                  )}
                </div>
              )}
              {viewLead.remarks && (
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Remarks / Notes</p>
                  <p className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">{viewLead.remarks}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 text-right">
              <button onClick={() => setViewLead(null)} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold transition text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <h3 className="text-md font-black text-[#0a2540]">Confirm Delete</h3>
              <p className="text-xs text-slate-500">Are you sure you want to delete this lead? This action cannot be undone.</p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold transition text-xs">
                Cancel
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-white font-bold transition text-xs">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
