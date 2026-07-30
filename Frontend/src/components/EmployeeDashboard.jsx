import { useState, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, Calendar, Clock, DollarSign, Award, Briefcase, User, 
  MapPin, CheckCircle, AlertCircle, Loader2, ArrowRight, Eye, Edit2, Trash2, X
} from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { getMergedLeadsAndStats } from "../utils/hierarchy";

const formatFriendlyDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateStr;
  }
};

const formatFriendlyTime = (timeStr) => {
  if (!timeStr) return null;
  const hhmm = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    let hh = parseInt(hhmm[1], 10);
    const mm = hhmm[2];
    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12;
    hh = hh ? hh : 12;
    return `${hh}:${mm} ${ampm}`;
  }
  if (timeStr.toLowerCase().includes("am") || timeStr.toLowerCase().includes("pm")) {
    return timeStr;
  }
  try {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      let hh = d.getHours();
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ampm = hh >= 12 ? "PM" : "AM";
      hh = hh % 12;
      hh = hh ? hh : 12;
      return `${hh}:${mm} ${ampm}`;
    }
  } catch (e) {}
  return timeStr;
};

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    todaysCalls: 0,
    interestedLeads: 0,
    pendingFollowUps: 0,
    todaysMeetings: 0
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
        api.get("/leads?limit=100")
      ]);

      const ownStats = statsRes.data.success ? statsRes.data.data : { todaysCalls: 0, interestedLeads: 0, pendingFollowUps: 0, todaysMeetings: 0 };
      const ownLeads = leadsRes.data.success ? leadsRes.data.data : [];

      const { leads: mergedLeads, stats: mergedStats } = await getMergedLeadsAndStats(user, ownLeads, ownStats);

      setStats(mergedStats);
      setRecentLeads(mergedLeads.slice(0, 10));
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
          { title: "Today's Calls", value: stats.todaysCalls || 0, color: "border-t-[#0a2540]", iconBg: "bg-blue-50 text-[#0a2540]", icon: <Phone size={22} /> },
          { title: "Interested Leads", value: stats.interestedLeads || 0, color: "border-t-emerald-500", iconBg: "bg-emerald-50 text-emerald-600", icon: <Award size={22} /> },
          { title: "Pending Follow-ups", value: stats.pendingFollowUps || 0, color: "border-t-[#d4af37]", iconBg: "bg-amber-50 text-[#d4af37]", icon: <Clock size={22} /> },
          { title: "Today's Meetings", value: stats.todaysMeetings || 0, color: "border-t-purple-500", iconBg: "bg-purple-50 text-purple-600", icon: <Calendar size={22} /> }
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

      {/* Recent CRM Actions Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between h-fit w-full">
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

      {/* Recent Leads Detailed Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden w-full">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewLead(null)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            className="bg-white rounded-[18px] shadow-2xl max-w-[900px] w-full max-h-[80vh] flex flex-col border border-slate-200 overflow-hidden z-50"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0a2540]/5 rounded-xl flex items-center justify-center text-[#0a2540]">
                  <Briefcase size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-[#0a2540]">Lead Profile</h3>
                    <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{viewLead.leadId}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Mhaveer Fincap CRM</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  viewLead.interested === "Yes" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                  viewLead.interested === "No" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                  "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
                  {viewLead.interested}
                </span>
                <button
                  onClick={() => setViewLead(null)}
                  className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                
                {/* Left Side (3 cols): Company Information & Remarks */}
                <div className="md:col-span-3 space-y-6">
                  {/* Company Info Card */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-2">
                      <User size={14} className="text-[#0a2540]" /> Company & Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Name</span>
                        <p className="font-extrabold text-[#0a2540] text-sm mt-0.5">{viewLead.companyName || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Person</span>
                        <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.contactPerson || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</span>
                        <p className="font-bold text-slate-700 text-xs mt-0.5 flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400" /> {viewLead.phone || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City</span>
                        <p className="font-bold text-slate-700 text-xs mt-0.5">{viewLead.city || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State</span>
                        <p className="font-bold text-slate-700 text-xs mt-0.5">{viewLead.state || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Remarks Card */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-2">
                      Remarks / Notes
                    </h4>
                    <div className="bg-slate-50/50 border border-slate-100/80 rounded-xl p-3.5 min-h-[90px] text-xs leading-relaxed text-slate-600 whitespace-pre-wrap font-medium">
                      {viewLead.remarks ? viewLead.remarks : <span className="text-slate-400 italic">No Remarks</span>}
                    </div>
                  </div>
                </div>

                {/* Right Side (2 cols): Loan, Status, Meeting & Follow-up */}
                <div className="md:col-span-2 space-y-6">
                  {/* Loan & Financial Details Card */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-2">
                      <DollarSign size={14} className="text-emerald-500" /> Loan & Financials
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loan Type</span>
                        <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.loanType || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CIBIL Score</span>
                        <p className={`font-black text-xs mt-0.5 ${
                          viewLead.cibilScore >= 750 ? "text-emerald-600" :
                          viewLead.cibilScore >= 650 ? "text-amber-500" :
                          "text-rose-500"
                        }`}>
                          {viewLead.cibilScore || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loan Required</span>
                        <p className="font-black text-emerald-600 text-xs mt-0.5">
                          {viewLead.loanAmount ? `₹${viewLead.loanAmount.toLocaleString("en-IN")}` : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yearly Income</span>
                        <p className="font-black text-slate-700 text-xs mt-0.5">
                          {viewLead.yearlyIncome ? `₹${viewLead.yearlyIncome.toLocaleString("en-IN")}` : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Call & Lead Status Card */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-2">
                      Status Overview
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interested</span>
                        <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.interested || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Call Status</span>
                        <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.callStatus || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Meeting Information Card */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-2">
                      <Calendar size={14} className="text-[#0a2540]" /> Meeting Details
                    </h4>
                    {viewLead.meetingDate ? (
                      <div className="flex gap-4 items-center">
                        <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-700 text-xs">{formatFriendlyDate(viewLead.meetingDate)}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock size={10} /> {formatFriendlyTime(viewLead.meetingTime) || "Time Not Specified"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic py-1">No Meeting Scheduled</p>
                    )}
                  </div>

                  {/* Follow-up Information highlighted card */}
                  <div className={`rounded-2xl p-5 border shadow-xs space-y-3 ${
                    viewLead.followUpDate 
                      ? "bg-amber-50/60 border-amber-200/50 text-[#0a2540]" 
                      : "bg-white border-slate-100 text-slate-700"
                  }`}>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100/50 pb-2">
                      <Clock size={14} className="text-amber-500" /> Follow-up Schedule
                    </h4>
                    {viewLead.followUpDate ? (
                      <div className="flex gap-4 items-center">
                        <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                          <Clock size={16} />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-700 text-xs">{formatFriendlyDate(viewLead.followUpDate)}</p>
                          <p className="text-[10px] font-bold text-slate-500 mt-0.5 flex items-center gap-1">
                            <Clock size={10} /> {formatFriendlyTime(viewLead.followUpTime) || "Time Not Specified"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic py-1">No Follow-up Scheduled</p>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3 z-10 shrink-0">
              <button 
                onClick={() => showToast("To edit this lead, please go to the 'My Leads' section.", "info")}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-bold transition text-xs shadow-xs cursor-pointer"
              >
                Edit Lead
              </button>
              <button 
                onClick={() => setViewLead(null)}
                className="px-6 py-2.5 bg-[#0a2540] hover:bg-[#0a2540]/90 text-white rounded-xl font-bold transition text-xs shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
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
