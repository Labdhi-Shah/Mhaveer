import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Eye, Edit2, Trash2, Loader2, ArrowLeft, Filter, RefreshCw, AlertCircle, CheckCircle, Clock,
  Briefcase, User, DollarSign, Calendar, Phone, X
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

export default function MyLeadsView() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterInterested, setFilterInterested] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState(null);

  // Modal States
  const [viewLead, setViewLead] = useState(null);
  const [editLead, setEditLead] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Edit Lead Form Hook
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm();

  const editInterestedValue = watch("interested");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get("/leads?limit=100");
      if (res.data.success) {
        const ownLeads = res.data.data.map(lead => ({
          ...lead,
          phone: lead.phoneNumber || lead.phone,
          companyTurnover: lead.companyTurnover !== undefined ? lead.companyTurnover : lead.yearlyIncome,
          address: lead.address !== undefined ? lead.address : lead.remarks
        }));
        const ownStats = { todaysCalls: 0, interestedLeads: 0, pendingFollowUps: 0, todaysMeetings: 0 };
        const { leads: mergedLeads } = await getMergedLeadsAndStats(user, ownLeads, ownStats);

        let filtered = mergedLeads;

        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(lead => 
            (lead.companyName || "").toLowerCase().includes(searchLower) ||
            (lead.contactPerson || "").toLowerCase().includes(searchLower) ||
            (lead.leadId || "").toLowerCase().includes(searchLower)
          );
        }

        if (filterType) {
          filtered = filtered.filter(lead => lead.loanType === filterType);
        }

        if (filterInterested) {
          filtered = filtered.filter(lead => lead.interested === filterInterested);
        }

        const limit = 10;
        const pages = Math.ceil(filtered.length / limit) || 1;
        setTotalPages(pages);

        const startIndex = (page - 1) * limit;
        const paginatedLeads = filtered.slice(startIndex, startIndex + limit);

        setLeads(paginatedLeads);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch leads.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, search, filterType, filterInterested]);

  // Open edit modal and populate values
  const openEditModal = (lead) => {
    setEditLead(lead);
    reset({
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      phone: lead.phone || lead.phoneNumber,
      city: lead.city || "",
      state: lead.state || "",
      companyTurnover: lead.companyTurnover !== undefined ? lead.companyTurnover : lead.yearlyIncome,
      loanAmount: lead.loanAmount,
      loanType: lead.loanType,
      propertyLoanCategory: lead.propertyLoanCategory || "",
      cibilScore: lead.cibilScore,
      interested: lead.interested,
      callStatus: lead.callStatus,
      meetingDate: lead.meetingDate || "",
      meetingTime: lead.meetingTime || "",
      address: lead.address !== undefined ? lead.address : (lead.remarks || ""),
      followUpDate: lead.followUpDate || "",
      followUpTime: lead.followUpTime || ""
    });
  };

  const onUpdateLead = async (data) => {
    if (!editLead) return;
    setSubmittingEdit(true);
    try {
      if (data.meetingDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const meetD = new Date(data.meetingDate);
        if (meetD < today) {
          showToast("Meeting date cannot be in the past.", "error");
          setSubmittingEdit(false);
          return;
        }
      }

      const payload = {
        ...data,
        phoneNumber: data.phone,
        companyTurnover: parseFloat(data.companyTurnover),
        loanAmount: parseFloat(data.loanAmount),
        cibilScore: parseInt(data.cibilScore)
      };

      if (payload.loanType !== "Property Loan") {
        delete payload.propertyLoanCategory;
      }

      const res = await api.put(`/leads/${editLead._id}`, payload);
      if (res.data.success) {
        showToast("Lead updated successfully!", "success");
        setEditLead(null);
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to update lead.", "error");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await api.delete(`/leads/${deleteConfirm}`);
      if (res.data.success) {
        showToast("Lead deleted successfully!", "success");
        setDeleteConfirm(null);
        fetchLeads();
      }
    } catch (err) {
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

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 border-l-8 border-l-[#0a2540]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0a2540]">My Assigned Leads</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mt-1">Loan Management CRM</p>
        </div>
        <button 
          onClick={fetchLeads}
          className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition"
        >
          <RefreshCw size={14} /> Refresh Leads
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="w-full md:w-96 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by Company, Contact Person or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/60 border border-slate-150 focus:border-[#0a2540] rounded-xl text-xs outline-none transition"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          {/* Loan Type Filter */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-[#0a2540] transition"
            >
              <option value="">All Loan Types</option>
              <option value="Home Loan">Home Loan</option>
              <option value="Business Loan">Business Loan</option>
              <option value="Property Loan">Property Loan</option>
            </select>
          </div>

          {/* Interested Filter */}
          <select
            value={filterInterested}
            onChange={(e) => {
              setFilterInterested(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-[#0a2540] transition"
          >
            <option value="">All Interest Levels</option>
            <option value="Yes">Interested (Yes)</option>
            <option value="No">Not Interested (No)</option>
            <option value="Call Back Later">Call Back Later</option>
          </select>
        </div>
      </div>

      {/* Main Leads Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-[#0a2540]" size={32} />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Syncing Lead Logs...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">No records found matching current criteria.</div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-[#0a2540] text-[#d4af37] font-extrabold uppercase whitespace-nowrap">
                    <th className="py-3.5 px-4 rounded-l-xl">LEAD ID</th>
                    <th className="py-3.5 px-4">COMPANY NAME</th>
                    <th className="py-3.5 px-4">CONTACT PERSON</th>
                    <th className="py-3.5 px-4">PHONE NUMBER</th>
                    <th className="py-3.5 px-4">LOAN TYPE</th>
                    <th className="py-3.5 px-4 text-center">CIBIL</th>
                    <th className="py-3.5 px-4 text-center">INTERESTED</th>
                    <th className="py-3.5 px-4 text-center">CALL STATUS</th>
                    <th className="py-3.5 px-4 text-center">MEETING</th>
                    <th className="py-3.5 px-4 text-center">FOLLOW-UP</th>
                    <th className="py-3.5 px-4 text-center rounded-r-xl">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
                  {leads.map((lead) => (
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
                            className="p-1.5 text-slate-400 hover:text-[#0a2540] hover:bg-slate-100 rounded-lg transition"
                            title="View Profile"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            onClick={() => openEditModal(lead)}
                            className="p-1.5 text-slate-400 hover:text-[#d4af37] hover:bg-slate-100 rounded-lg transition"
                            title="Edit Lead"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => setDeleteConfirm(lead._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
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
            className="bg-white rounded-[18px] shadow-2xl max-w-[900px] w-full max-h-[80vh] flex flex-col border border-slate-200 overflow-hidden z-50 text-left"
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

                  {/* Address Card */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-2">
                      Address
                    </h4>
                    <div className="bg-slate-50/50 border border-slate-100/80 rounded-xl p-3.5 min-h-[90px] text-xs leading-relaxed text-slate-600 whitespace-pre-wrap font-medium">
                      {viewLead.address ? viewLead.address : <span className="text-slate-400 italic">No Address Specified</span>}
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
                      {viewLead.loanType === "Property Loan" && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Property Loan Category</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.propertyLoanCategory || "N/A"}</p>
                        </div>
                      )}
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
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Turnover</span>
                        <p className="font-black text-slate-700 text-xs mt-0.5">
                          {viewLead.companyTurnover ? `₹${viewLead.companyTurnover.toLocaleString("en-IN")}` : 
                           viewLead.yearlyIncome ? `₹${viewLead.yearlyIncome.toLocaleString("en-IN")}` : "N/A"}
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
                onClick={() => { setViewLead(null); openEditModal(viewLead); }}
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

      {/* 2. Edit Lead Details Modal */}
      {editLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#0a2540]">Edit Lead Details: {editLead.leadId}</h3>
              <button onClick={() => setEditLead(null)} className="text-slate-400 hover:text-[#0a2540] font-black text-sm">✕</button>
            </div>
            
            <form onSubmit={handleSubmit(onUpdateLead)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Company Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Company Name *</label>
                  <input
                    type="text"
                    {...register("companyName", { required: "Company Name is required" })}
                    className={`w-full px-4 py-2 border rounded-xl text-xs outline-none focus:border-[#0a2540] ${errors.companyName ? "border-rose-455" : "border-slate-200"}`}
                  />
                  {errors.companyName && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.companyName.message}</p>}
                </div>

                {/* Contact Person Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    {...register("contactPerson", { required: "Contact Person Name is required" })}
                    className={`w-full px-4 py-2 border rounded-xl text-xs outline-none focus:border-[#0a2540] ${errors.contactPerson ? "border-rose-455" : "border-slate-200"}`}
                  />
                  {errors.contactPerson && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.contactPerson.message}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    {...register("phone", { 
                      required: "Phone is required",
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message: "10 digit mobile starting with 6-9 only"
                      }
                    })}
                    className={`w-full px-4 py-2 border rounded-xl text-xs outline-none focus:border-[#0a2540] ${errors.phone ? "border-rose-455" : "border-slate-200"}`}
                  />
                  {errors.phone && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.phone.message}</p>}
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">City</label>
                  <input type="text" {...register("city")} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0a2540]" />
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">State</label>
                  <input type="text" {...register("state")} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0a2540]" />
                </div>

                {/* Company Turnover */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Company Turnover *</label>
                  <input
                    type="number"
                    {...register("companyTurnover", { required: "Company Turnover is required", min: 1 })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0a2540]"
                  />
                </div>

                {/* Loan Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Loan Required *</label>
                  <input
                    type="number"
                    {...register("loanAmount", { required: "Loan Amount required", min: 1 })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0a2540]"
                  />
                </div>

                {/* Loan Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Type of Loan *</label>
                  <select
                    {...register("loanType", { required: "Loan Type is required" })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0a2540] bg-white"
                  >
                    <option value="Home Loan">Home Loan</option>
                    <option value="Business Loan">Business Loan</option>
                    <option value="Property Loan">Property Loan</option>
                  </select>
                </div>

                {/* Property Loan Category (if Loan Type is Property Loan) */}
                {watch("loanType") === "Property Loan" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Property Loan Category *</label>
                    <select
                      {...register("propertyLoanCategory", { required: "Property Loan Category is required" })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0a2540] bg-white"
                    >
                      <option value="">Select Category</option>
                      <option value="Commercial Loan">Commercial Loan</option>
                      <option value="Industrial Loan">Industrial Loan</option>
                      <option value="Residential Loan">Residential Loan</option>
                      <option value="Plot Loan">Plot Loan</option>
                    </select>
                  </div>
                )}

                {/* CIBIL Score */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">CIBIL Score *</label>
                  <input
                    type="number"
                    {...register("cibilScore", { required: "CIBIL score required", min: 700, max: 900 })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0a2540]"
                  />
                </div>

                {/* Interested */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Interested *</label>
                  <select
                    {...register("interested", { required: "Interested is required" })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0a2540] bg-white"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Call Back Later">Call Back Later</option>
                  </select>
                </div>

                {/* Call Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Call Status *</label>
                  <select
                    {...register("callStatus", { required: "Call status is required" })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0a2540] bg-white"
                  >
                    <option value="Connected">Connected</option>
                    <option value="Not Picked">Not Picked</option>
                    <option value="Busy">Busy</option>
                    <option value="Wrong Number">Wrong Number</option>
                  </select>
                </div>

                {/* Meeting Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Meeting Date</label>
                  <input type="date" {...register("meetingDate")} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0a2540] bg-white" />
                </div>

                {/* Meeting Time */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Meeting Time</label>
                  <input type="time" {...register("meetingTime")} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0a2540] bg-white" />
                </div>
              </div>

              {/* Conditional Follow Up */}
              {editInterestedValue === "Call Back Later" && (
                <div className="border border-amber-200 bg-amber-50/50 p-4 rounded-2xl grid grid-cols-2 gap-4">
                  <p className="col-span-full text-xs font-bold text-[#d4af37] flex items-center gap-1.5"><Clock size={14} /> Update Follow-up Schedule</p>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Follow-up Date *</label>
                    <input type="date" {...register("followUpDate", { required: true })} className="w-full px-4 py-2 border border-amber-300 rounded-xl text-xs bg-white outline-none focus:border-[#0a2540]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Follow-up Time *</label>
                    <input type="time" {...register("followUpTime", { required: true })} className="w-full px-4 py-2 border border-amber-300 rounded-xl text-xs bg-white outline-none focus:border-[#0a2540]" />
                  </div>
                </div>
              )}

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Address</label>
                <textarea rows="3" {...register("address")} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0a2540]"></textarea>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setEditLead(null)} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold transition text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={submittingEdit} className="px-5 py-2 bg-[#0a2540] hover:bg-[#153452] text-white font-bold rounded-xl transition text-xs flex items-center gap-1.5">
                  {submittingEdit ? <Loader2 size={14} className="animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Modal */}
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
