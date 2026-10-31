import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Eye, Edit2, Trash2, Loader2, ArrowLeft, Filter, RefreshCw, AlertCircle, CheckCircle, Clock,
  Briefcase, User, DollarSign, Calendar, Phone, X,
  Building2, Landmark, FileText, FileSpreadsheet, Plus
} from "lucide-react";
import * as XLSX from "xlsx";
import { downloadXLSX } from "../utils/fileDownloader";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { getMergedLeadsAndStats, getUserRole } from "../utils/hierarchy";
import socket from "../utils/socket";

const formatINR = (val) => {
  if (val === undefined || val === null || val === "") return null;
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return `₹${num.toLocaleString("en-IN")}`;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return dateStr;
  }
};

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = getUserRole(user);
  const isManager = role === "Manager";
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
  const [exporting, setExporting] = useState(false);
  const [editActivePhoneIndex, setEditActivePhoneIndex] = useState(0);

  const handleExportExcel = () => {
    if (!leads || leads.length === 0) {
      setToast({ message: "No leads available to export.", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      setExporting(true);
      const formatCurrency = (val) => {
        if (val === undefined || val === null || val === "" || isNaN(Number(val))) return "-";
        return `₹${Number(val).toLocaleString("en-IN")}`;
      };

      const formatDate = (val) => {
        if (!val) return "-";
        try {
          const d = new Date(val);
          return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        } catch {
          return String(val);
        }
      };

      const dataToExport = leads.map((lead, idx) => ({
        "Sr No": idx + 1,
        "Lead ID": lead.leadId || `LD-${idx + 1}`,
        "Company Name": lead.companyName || "-",
        "Contact Person": lead.contactPerson || "-",
        "Phone Number": lead.phone || lead.phoneNumber || "-",
        "City": lead.city || "-",
        "State": lead.state || "-",
        "Complete Address": lead.address || "-",
        "Loan Amount Required": formatCurrency(lead.loanAmount),
        "Loan Type": lead.loanType || "-",
        "Loan Category / Sub-Type": lead.propertyPurchaseCategory || lead.propertyLoanCategory || lead.businessLoanType || "-",
        "Turnover 1 (T1)": formatCurrency(lead.companyTurnover || lead.yearlyIncome),
        "Turnover 2 (T2)": formatCurrency(lead.companyTurnover1),
        "Turnover 3 (T3)": formatCurrency(lead.companyTurnover2),
        "Interested": lead.interested || "-",
        "Call Status": lead.callStatus || "-",
        "Meeting Date": formatDate(lead.meetingDate),
        "Meeting Time": lead.meetingTime || "-",
        "Follow-Up Date": formatDate(lead.followUpDate),
        "Follow-Up Time": lead.followUpTime || "-",
        "Remarks / Notes": lead.remarks || "-",
        "Employee Name": lead.employeeName || "-",
        "Employee Code": lead.employeeCode || lead.employeeId || "-",
        "Created Date": formatDate(lead.createdAt)
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);

      const colWidths = Object.keys(dataToExport[0] || {}).map(key => {
        const maxContentLength = Math.max(
          key.length,
          ...dataToExport.map(row => String(row[key] !== undefined && row[key] !== null ? row[key] : "").length).slice(0, 50)
        );
        return { wch: Math.min(Math.max(maxContentLength + 3, 12), 40) };
      });
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "My Leads");

      const dateStr = new Date().toISOString().slice(0, 10);
      downloadXLSX(wb, `Leads_Export_${dateStr}.xlsx`);

      setToast({ message: `Exported ${dataToExport.length} leads to Excel successfully!`, type: "success" });
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      console.error("Export leads error:", err);
      setToast({ message: "Failed to export leads to Excel.", type: "error" });
      setTimeout(() => setToast(null), 3500);
    } finally {
      setExporting(false);
    }
  };

  const handleOpenViewLead = async (lead) => {
    setViewLead(lead);
    try {
      const res = await api.get(`/leads/${lead._id}`);
      if (res.data?.success && res.data?.data) {
        setViewLead((prev) => (prev && prev._id === lead._id ? { ...prev, ...res.data.data } : prev));
      }
    } catch (err) {
      console.error("Failed to fetch fresh lead details:", err);
    }
  };

  // Edit Lead Form Hook
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    clearErrors,
    formState: { errors }
  } = useForm();

  const editInterestedValue = watch("interested");
  const editCallStatusValue = watch("callStatus");
  const isEditWrongNumber = editCallStatusValue === "Wrong Number";
  const isEditFollowUp = !isEditWrongNumber && (editInterestedValue === "Call Back Later" || editCallStatusValue === "Busy");
  const isEditAllMandatory = editInterestedValue === "Yes" && !isEditWrongNumber;

  useEffect(() => {
    if (!isEditAllMandatory) {
      clearErrors(["companyTurnover", "loanAmount", "loanType", "propertyLoanCategory"]);
    }
    if (isEditWrongNumber) {
      clearErrors(["companyName", "contactPerson", "city", "state", "phone", "phone0", "phone1", "phone2", "phone3", "followUpDate", "followUpTime"]);
    }
  }, [isEditAllMandatory, isEditWrongNumber, clearErrors]);



  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchLeads = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get("/leads?limit=100");
      if (res.data.success) {
        const ownLeads = res.data.data.map(lead => ({
          ...lead,
          phone: lead.phoneNumber || lead.phone,
          companyTurnover: lead.companyTurnover !== undefined ? lead.companyTurnover : lead.yearlyIncome,
          address: lead.address || "",
          remarks: lead.remarks || ""
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
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, search, filterType, filterInterested]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleUpdate = (payload) => {
      if (payload && payload.entity === "lead") {
        if (payload.action === "delete" && payload.id) {
          setLeads((prev) => prev.filter((l) => l._id !== payload.id));
        } else if (payload.action === "update" && payload.data) {
          const updated = payload.data;
          setLeads((prev) => prev.map((l) => l._id === updated._id ? {
            ...l,
            ...updated,
            phone: updated.phoneNumber || updated.phone || l.phone,
            companyTurnover: updated.companyTurnover !== undefined ? updated.companyTurnover : l.companyTurnover,
            address: updated.address !== undefined ? updated.address : l.address
          } : l));
        } else if (payload.action === "create" && payload.data) {
          const lead = payload.data;
          const formatted = {
            ...lead,
            phone: lead.phoneNumber || lead.phone,
            companyTurnover: lead.companyTurnover !== undefined ? lead.companyTurnover : lead.yearlyIncome,
            address: lead.address !== undefined ? lead.address : lead.remarks
          };
          setLeads((prev) => [formatted, ...prev.filter((l) => l._id !== formatted._id)]);
        }
      }
      fetchLeads(false);
    };

    const handleLeadCreated = (data) => handleUpdate({ entity: "lead", action: "create", data });
    const handleLeadUpdated = (data) => handleUpdate({ entity: "lead", action: "update", data });
    const handleLeadDeleted = (id) => handleUpdate({ entity: "lead", action: "delete", id });

    socket.on("data-updated", handleUpdate);
    socket.on("leads-updated", handleUpdate);
    socket.on("lead:created", handleLeadCreated);
    socket.on("lead:updated", handleLeadUpdated);
    socket.on("lead:deleted", handleLeadDeleted);

    return () => {
      socket.off("data-updated", handleUpdate);
      socket.off("leads-updated", handleUpdate);
      socket.off("lead:created", handleLeadCreated);
      socket.off("lead:updated", handleLeadUpdated);
      socket.off("lead:deleted", handleLeadDeleted);
    };
  }, [user]);

  // Open edit modal and populate values
  const openEditModal = (lead) => {
    setEditLead(lead);
    setEditActivePhoneIndex(0);

    const rawPhones = (lead.phoneNumber || lead.phone || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    reset({
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      phone0: rawPhones[0] || "",
      phone1: rawPhones[1] || "",
      phone2: rawPhones[2] || "",
      phone3: rawPhones[3] || "",
      phone: rawPhones[0] || "",
      city: lead.city || "",
      state: lead.state || "",
      companyTurnover: lead.companyTurnover !== undefined ? lead.companyTurnover : lead.yearlyIncome,
      loanAmount: lead.loanAmount,
      loanType: lead.loanType,
      propertyLoanCategory: lead.propertyLoanCategory || "",
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

      const isWrongNum = data.callStatus === "Wrong Number";

      // Combine phone numbers into comma-separated string
      const phoneNumbers = [data.phone0, data.phone1, data.phone2, data.phone3]
        .filter(Boolean)
        .map(s => String(s).trim())
        .filter(Boolean)
        .join(", ");

      const primaryPhone = (data.phone0 && String(data.phone0).trim()) || (data.phone && String(data.phone).trim()) || "";

      const payload = {
        ...data,
        phoneNumber: isWrongNum ? (phoneNumbers || "Wrong Number") : (phoneNumbers || primaryPhone),
        phone: isWrongNum ? (phoneNumbers || "Wrong Number") : (phoneNumbers || primaryPhone),
        companyTurnover: data.companyTurnover && !isNaN(parseFloat(data.companyTurnover)) ? parseFloat(data.companyTurnover) : undefined,
        loanAmount: data.loanAmount && !isNaN(parseFloat(data.loanAmount)) ? parseFloat(data.loanAmount) : undefined
      };

      // Remove component helper fields before sending
      delete payload.phone0;
      delete payload.phone1;
      delete payload.phone2;
      delete payload.phone3;

      if (isWrongNum) {
        payload.interested = "No";
        payload.callStatus = "Wrong Number";
        delete payload.loanType;
        delete payload.propertyLoanCategory;
        delete payload.meetingDate;
        delete payload.meetingTime;
        delete payload.followUpDate;
        delete payload.followUpTime;
      } else {
        if (!payload.loanType) {
          delete payload.loanType;
        }
        if (payload.loanType !== "Property Loan") {
          delete payload.propertyLoanCategory;
        }
      }

      const res = await api.put(`/leads/${editLead._id}`, payload);
      if (res.data.success) {
        showToast("Lead updated successfully!", "success");
        setEditLead(null);
        if (viewLead && viewLead._id === editLead._id) {
          setViewLead((prev) => ({ ...prev, ...res.data.data }));
        }
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update lead.", "error");
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
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 border-l-8 border-l-[#162335]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#162335]">My Assigned Leads</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-[#9ca3af] mt-1">Loan Management CRM</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={fetchLeads}
            className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            <RefreshCw size={14} /> Refresh Leads
          </button>
          <button
            onClick={handleExportExcel}
            disabled={loading || leads.length === 0 || exporting}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
            title="Export Leads to Excel"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
            <span>Export in Excel</span>
          </button>
        </div>
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
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/60 border border-slate-150 focus:border-[#162335] rounded-xl text-xs outline-none transition"
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
              className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-[#162335] transition"
            >
              <option value="">All Loan Types</option>
              <option value="Property Purchase Loan">Property Purchase Loan</option>
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
            className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-[#162335] transition"
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
            <Loader2 className="animate-spin text-[#162335]" size={32} />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Syncing Lead Logs...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">No records found matching current criteria.</div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-[#162335] text-white font-extrabold uppercase whitespace-nowrap">
                    <th className="py-3.5 px-4 rounded-l-xl">LEAD ID</th>
                    <th className="py-3.5 px-4">COMPANY NAME</th>
                    <th className="py-3.5 px-4">CONTACT PERSON</th>
                    <th className="py-3.5 px-4">PHONE NUMBER</th>
                    <th className="py-3.5 px-4">LOAN TYPE</th>
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
                      <td className="py-3.5 px-4 font-mono font-black text-[#162335]">{lead.leadId}</td>
                      <td className="py-3.5 px-4 font-bold text-[#162335]">{lead.companyName}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{lead.contactPerson}</td>
                      <td className="py-3.5 px-4 text-slate-600">{lead.phone}</td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-500">{lead.loanType}</td>
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
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick View Profile Button */}
                          <button 
                            onClick={() => handleOpenViewLead(lead)}
                            className="p-1.5 text-slate-400 hover:text-[#162335] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="View Profile"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Quick Edit Lead Button */}
                          <button 
                            onClick={() => openEditModal(lead)}
                            className="p-1.5 text-slate-400 hover:text-[#162335] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Edit Lead"
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Quick Delete Lead Button (Managers only) */}
                          {isManager && (
                            <button 
                              onClick={() => setDeleteConfirm(lead._id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete Lead"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 print:hidden">
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
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden z-50 text-left"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#162335] text-white rounded-2xl flex items-center justify-center shadow-sm">
                  <Briefcase size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-[#162335]">Lead Details Overview</h3>
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                      {viewLead.leadId || "LEAD-N/A"}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                    Created on {formatDateTime(viewLead.createdAt) || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  viewLead.interested === "Yes"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : viewLead.interested === "No"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
                  Interest: {viewLead.interested || "N/A"}
                </span>
                {viewLead.callStatus && (
                  <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {viewLead.callStatus}
                  </span>
                )}
                <button
                  onClick={() => setViewLead(null)}
                  className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition cursor-pointer"
                  title="Close Modal"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/60">

              {/* 1. CREATED BY EMPLOYEE BANNER CARD */}
              <div className="bg-gradient-to-r from-[#162335] via-[#1c2c42] to-[#243954] text-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
                    <User size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        Lead Creator
                      </span>
                      <span className="text-xs text-slate-300 font-mono">
                        ID: {viewLead.employeeCode || viewLead.employeeId || "N/A"}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-white mt-1">
                      {viewLead.employeeName || "Unknown Employee"}
                    </h4>
                  </div>
                </div>
              </div>

              {/* 2. MAIN DETAILS GRID */}
              {(() => {
                const companyList = (viewLead.companyName || "").split(",").map(s => s.trim()).filter(Boolean);
                const contactList = (viewLead.contactPerson || "").split(",").map(s => s.trim()).filter(Boolean);
                const phoneList = (viewLead.phone || viewLead.phoneNumber || "").split(",").map(s => s.trim()).filter(Boolean);

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Company & Contact Information Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                      <h4 className="text-xs font-black text-[#162335] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
                        <Building2 size={15} className="text-[#162335]" /> Company & Contact Information
                      </h4>
                      <div className="space-y-3.5">
                        {/* Company Names */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Company Name(s)</span>
                          {companyList.length > 1 ? (
                            <div className="flex flex-col gap-1.5">
                              {companyList.map((comp, idx) => (
                                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                                  <span className="text-[9px] font-black text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                    Company {idx + 1}
                                  </span>
                                  <span className="text-xs font-black text-[#162335]">{comp}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="font-black text-[#162335] text-sm mt-0.5">{viewLead.companyName || "N/A"}</p>
                          )}
                        </div>

                        {/* Contact Person(s) */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact Person(s)</span>
                          {contactList.length > 1 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {contactList.map((cp, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-bold text-slate-700">
                                  <span className="text-[9px] font-black text-slate-400">Person {idx + 1}:</span> {cp}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.contactPerson || "N/A"}</p>
                          )}
                        </div>

                        {/* Phone Number(s) */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone Number(s)</span>
                          {phoneList.length > 1 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {phoneList.map((ph, idx) => (
                                <a key={idx} href={`tel:${ph}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg text-xs font-bold text-slate-700 transition">
                                  <Phone size={10} className="text-slate-400" />
                                  <span className="text-[9px] font-black text-slate-400">Phone {idx + 1}:</span> {ph}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="font-extrabold text-slate-700 text-xs mt-0.5 flex items-center gap-1.5">
                              <Phone size={12} className="text-slate-400" /> {viewLead.phone || viewLead.phoneNumber || "N/A"}
                            </p>
                          )}
                        </div>

                        {/* Location: State & City */}
                        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City</span>
                            <p className="font-bold text-slate-700 text-xs mt-0.5">{viewLead.city || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State</span>
                            <p className="font-bold text-slate-700 text-xs mt-0.5">{viewLead.state || "N/A"}</p>
                          </div>
                        </div>

                        {/* Address */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Complete Address</span>
                          <div className="mt-1 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                            {viewLead.address || <span className="text-slate-400 italic">No Address Specified</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Financials & Turnovers Card (T1, T2, T3) */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                      <h4 className="text-xs font-black text-[#162335] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
                        <DollarSign size={15} className="text-emerald-600" /> Financial Requirements & Turnovers
                      </h4>
                      <div className="space-y-4">
                        {/* Loan Amount */}
                        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Loan Amount Required</span>
                          <p className="text-xl font-black text-emerald-700 mt-0.5">
                            {formatINR(viewLead.loanAmount) || "N/A"}
                          </p>
                        </div>

                        {/* Turnovers T1, T2, T3 Grid */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Company Turnovers (T1, T2, T3)
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">All 3 Years</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {/* T1 */}
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-extrabold uppercase text-slate-500">T1</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#162335] text-white">Year 1</span>
                              </div>
                              <p className="text-xs font-black text-[#162335]">
                                {formatINR(viewLead.companyTurnover || viewLead.yearlyIncome) || <span className="text-slate-400 font-normal">Not Entered</span>}
                              </p>
                            </div>
                            {/* T2 */}
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-extrabold uppercase text-slate-500">T2</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#162335] text-white">Year 2</span>
                              </div>
                              <p className="text-xs font-black text-[#162335]">
                                {formatINR(viewLead.companyTurnover1) || <span className="text-slate-400 font-normal">Not Entered</span>}
                              </p>
                            </div>
                            {/* T3 */}
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-extrabold uppercase text-slate-500">T3</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#162335] text-white">Year 3</span>
                              </div>
                              <p className="text-xs font-black text-[#162335]">
                                {formatINR(viewLead.companyTurnover2) || <span className="text-slate-400 font-normal">Not Entered</span>}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Statuses */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interested Status</span>
                            <p className="font-extrabold text-slate-800 text-xs mt-0.5">{viewLead.interested || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Call Status</span>
                            <p className="font-extrabold text-slate-800 text-xs mt-0.5">{viewLead.callStatus || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}

              {/* 3. DETAILED LOAN SPECIFICATIONS CARD (Dynamic) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 flex-wrap gap-2">
                  <h4 className="text-xs font-black text-[#162335] uppercase tracking-wider flex items-center gap-2">
                    <Landmark size={15} className="text-[#162335]" /> Loan Category & Detailed Specifications
                  </h4>
                  <span className="text-xs font-extrabold px-3 py-1 bg-[#162335] text-white rounded-lg shadow-xs">
                    Type: {viewLead.loanType || "Not Specified"}
                  </span>
                </div>

                {/* If Property Purchase Loan */}
                {viewLead.loanType === "Property Purchase Loan" && (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center gap-2 flex-wrap p-3 bg-slate-50 border border-slate-150 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category Selected:</span>
                      <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black">
                        {viewLead.propertyPurchaseCategory || "Standard Property Purchase"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Property Location</span>
                        <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.ppLocation || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Market Rate</span>
                        <p className="font-extrabold text-slate-700 text-xs mt-0.5">{formatINR(viewLead.ppMarketRate) || viewLead.ppMarketRate || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dastavej Rate</span>
                        <p className="font-extrabold text-slate-700 text-xs mt-0.5">{formatINR(viewLead.ppDastavejRate) || viewLead.ppDastavejRate || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ownership Name</span>
                        <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.ppDastavejName || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* If Property Loan */}
                {viewLead.loanType === "Property Loan" && (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center gap-2 flex-wrap p-3 bg-slate-50 border border-slate-150 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Property Loan Sub-Category:</span>
                      <span className="px-2.5 py-1 bg-[#162335] text-white rounded-lg text-xs font-black">
                        {viewLead.propertyLoanCategory || "Not Specified"}
                      </span>
                    </div>

                    {/* Working Capital */}
                    {viewLead.propertyLoanCategory === "Working Capital" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Property Location</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.propertyLocation || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration of Rent Property</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.durationOfRentProperty || "N/A"}</p>
                        </div>
                      </div>
                    )}

                    {/* LAP */}
                    {viewLead.propertyLoanCategory === "LAP" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LAP Property Type</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.lapPropertyType || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.lapPropertyLocation || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Market Value</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{formatINR(viewLead.lapPropertyMarketValue) || viewLead.lapPropertyMarketValue || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type of Work</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.lapPropertyWork || "N/A"}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ownership list</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.lapPropertyDocumentList || "N/A"}</p>
                        </div>
                      </div>
                    )}

                    {/* Unsold */}
                    {viewLead.propertyLoanCategory === "Unsold" && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unsold Unit</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.unsoldUnit || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Market Value (MV)</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{formatINR(viewLead.unsoldMV) || viewLead.unsoldMV || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Book Value (BV)</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.unsoldBV ? "Yes" : "No"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Floor</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.unsoldFloor || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheme Name</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.unsoldScheme || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.unsoldLocation || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dastavej</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.unsoldDastavej || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Partnership</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.unsoldPartnership || "N/A"}</p>
                        </div>
                      </div>
                    )}

                    {/* LRD */}
                    {viewLead.propertyLoanCategory === "LRD" && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Rent</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{formatINR(viewLead.lrdRent) || viewLead.lrdRent || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Market Value</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{formatINR(viewLead.lrdMarketValue) || viewLead.lrdMarketValue || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LOI Year</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.lrdLoiYear || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.lrdLocation || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheme Name</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.lrdSchemeName || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dastavej</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.lrdDastavej || "N/A"}</p>
                        </div>
                      </div>
                    )}

                    {/* NA Plot */}
                    {viewLead.propertyLoanCategory === "NA Plot" && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.naPlotLocation || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Market Value (MV)</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{formatINR(viewLead.naPlotMV) || viewLead.naPlotMV || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NA Plot</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.naPlotYesNo ? "Yes" : "No"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vacant</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.naPlotVacant ? "Yes" : "No"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheme</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.naPlotScheme || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dastavej</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.naPlotDastavej || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">VAR</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.naPlotVAR || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lavani</span>
                          <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.naPlotLavani || "N/A"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* If Business Loan */}
                {viewLead.loanType === "Business Loan" && (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center gap-2 flex-wrap p-3 bg-slate-50 border border-slate-150 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Business Loan Type:</span>
                      <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-black">
                        {viewLead.businessLoanType || "Standard Business Loan"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Starting Year</span>
                        <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.businessStartingYear || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nature / Type of Work</span>
                        <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.businessTypeOfWork || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* If Balance Transfer */}
                {viewLead.loanType === "Balance Transfer" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bank Name</span>
                      <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.btBankName || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rate of Interest</span>
                      <p className="font-extrabold text-slate-700 text-xs mt-0.5">
                        {viewLead.btRateOfInterest ? `${viewLead.btRateOfInterest}%` : "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Property Type</span>
                      <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.btPropertyType || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Market Value</span>
                      <p className="font-extrabold text-slate-700 text-xs mt-0.5">{formatINR(viewLead.btMarketValue) || viewLead.btMarketValue || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</span>
                      <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.btLocation || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</span>
                      <p className="font-extrabold text-slate-700 text-xs mt-0.5">{viewLead.btDuration || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Amount</span>
                      <p className="font-extrabold text-slate-700 text-xs mt-0.5">{formatINR(viewLead.btOutstanding) || viewLead.btOutstanding || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Foreclosure Charge</span>
                      <p className="font-extrabold text-slate-700 text-xs mt-0.5">
                        {viewLead.btForeclosureCharge ? `${viewLead.btForeclosureCharge}%` : "N/A"}
                      </p>
                    </div>
                  </div>
                )}

                {/* If No loan specific fields */}
                {!["Property Purchase Loan", "Property Loan", "Business Loan", "Balance Transfer"].includes(viewLead.loanType) && (
                  <p className="text-slate-400 text-xs italic py-1">
                    Standard Loan or No Additional Category Specifications.
                  </p>
                )}
              </div>

              {/* 4. SCHEDULES & STATUS SECTION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Meeting Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                  <h4 className="text-xs font-black text-[#162335] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Calendar size={14} className="text-[#162335]" /> Meeting Schedule
                  </h4>
                  {viewLead.meetingDate ? (
                    <div className="flex gap-3.5 items-center p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl">
                      <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 text-xs">{formatFriendlyDate(viewLead.meetingDate)}</p>
                        <p className="text-[11px] font-bold text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock size={11} className="text-slate-400" /> {formatFriendlyTime(viewLead.meetingTime) || "Time Not Specified"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs italic py-2">No Meeting Scheduled</p>
                  )}
                </div>

                {/* Follow-up Card */}
                <div className={`bg-white rounded-2xl p-5 border shadow-xs space-y-3 ${
                  viewLead.followUpDate ? "border-amber-200/70" : "border-slate-200/80"
                }`}>
                  <h4 className="text-xs font-black text-[#162335] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Clock size={14} className="text-amber-500" /> Follow-Up Schedule
                  </h4>
                  {viewLead.followUpDate ? (
                    <div className="flex gap-3.5 items-center p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl">
                      <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 text-xs">{formatFriendlyDate(viewLead.followUpDate)}</p>
                        <p className="text-[11px] font-bold text-amber-700 mt-0.5 flex items-center gap-1">
                          <Clock size={11} className="text-amber-500" /> {formatFriendlyTime(viewLead.followUpTime) || "Time Not Specified"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs italic py-2">No Follow-up Scheduled</p>
                  )}
                </div>
              </div>

              {/* 5. REMARKS / NOTES CARD */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                <h4 className="text-xs font-black text-[#162335] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <FileText size={14} className="text-[#162335]" /> Employee Remarks & Call Notes
                </h4>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 min-h-[70px] text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">
                  {viewLead.remarks || <span className="text-slate-400 italic">No remarks recorded by employee.</span>}
                </div>
              </div>

              {/* 6. MANAGER VISIT REMARKS CARD (From Manager's Fill Form) */}
              {(viewLead.meetingPersonNotes || viewLead.meetingPersonName) && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2 flex-wrap gap-2">
                    <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                      <FileText size={14} className="text-emerald-700" /> Manager Visit Remarks & Form Notes
                    </h4>
                    {viewLead.meetingPersonName && (
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                        Client Met By: <strong>{viewLead.meetingPersonName}</strong>
                      </span>
                    )}
                  </div>
                  <div className="bg-white border border-emerald-100 rounded-xl p-4 min-h-[70px] text-xs leading-relaxed text-slate-800 whitespace-pre-wrap font-semibold shadow-2xs">
                    {viewLead.meetingPersonNotes || <span className="text-slate-400 italic">No visit remarks recorded.</span>}
                  </div>
                </div>
              )}

            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3 z-10 shrink-0">
              <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Showing all recorded details submitted by {viewLead.employeeName || "employee"}
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button 
                  onClick={() => { setViewLead(null); openEditModal(viewLead); }}
                  className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-bold transition text-xs shadow-xs cursor-pointer"
                >
                  Edit Lead
                </button>
                <button
                  onClick={() => setViewLead(null)}
                  className="px-6 py-2.5 bg-[#162335] hover:bg-[#162335]/90 text-white rounded-xl font-bold transition text-xs shadow-sm cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 2. Edit Lead Details Modal */}
      {editLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#162335]">Edit Lead Details: {editLead.leadId}</h3>
              <button onClick={() => setEditLead(null)} className="text-slate-400 hover:text-[#162335] font-black text-sm">✕</button>
            </div>
            
            <form onSubmit={handleSubmit(onUpdateLead)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Company Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Company Name {!isEditWrongNumber && "*"}</label>
                  <input
                    type="text"
                    {...register("companyName", { required: !isEditWrongNumber ? "Company Name is required" : false })}
                    className={`w-full px-4 py-2 border rounded-xl text-xs outline-none focus:border-[#162335] ${errors.companyName ? "border-rose-455" : "border-slate-200"}`}
                  />
                  {errors.companyName && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.companyName.message}</p>}
                </div>

                {/* Contact Person Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Contact Person Name {!isEditWrongNumber && "*"}</label>
                  <input
                    type="text"
                    {...register("contactPerson", { required: !isEditWrongNumber ? "Contact Person Name is required" : false })}
                    className={`w-full px-4 py-2 border rounded-xl text-xs outline-none focus:border-[#162335] ${errors.contactPerson ? "border-rose-455" : "border-slate-200"}`}
                  />
                  {errors.contactPerson && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.contactPerson.message}</p>}
                </div>

                {/* Phone Numbers Section */}
                <div className="sm:col-span-2 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Phone Number {!isEditWrongNumber && "*"}
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Add or update contact phone numbers for this lead
                      </span>
                    </div>

                    {/* Phone Tabs (Phone 1, Phone 2, Phone 3, Phone 4) + Add Phone button */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[0, 1, 2, 3].map((idx) => {
                        const val = watch(`phone${idx}`);
                        const isFilled = val && String(val).trim().length > 0;
                        const isActive = editActivePhoneIndex === idx;
                        const hasError = errors[`phone${idx}`];
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditActivePhoneIndex(idx)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                              isActive
                                ? "bg-[#162335] text-white border-[#162335] shadow-xs"
                                : hasError
                                  ? "bg-rose-50 text-rose-600 border-rose-300"
                                  : isFilled
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <span>Phone {idx + 1}</span>
                            {isFilled && (
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-emerald-600"}`} />
                            )}
                          </button>
                        );
                      })}

                      {(() => {
                        const nextEmpty = [0, 1, 2, 3].find((i) => !watch(`phone${i}`));
                        if (nextEmpty !== undefined && nextEmpty !== editActivePhoneIndex) {
                          return (
                            <button
                              type="button"
                              onClick={() => setEditActivePhoneIndex(nextEmpty)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#162335] bg-white hover:bg-slate-100 border border-dashed border-slate-300 transition flex items-center gap-1 cursor-pointer"
                              title="Add another phone number"
                            >
                              <Plus size={12} />
                              <span>Add Phone</span>
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Active Phone Input */}
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx} className={editActivePhoneIndex === idx ? "block" : "hidden"}>
                      <div className="relative">
                        <input
                          type="tel"
                          placeholder={idx === 0 ? "Enter primary 10-digit mobile number *" : `Enter Phone ${idx + 1} (optional 10-digit mobile)`}
                          {...register(`phone${idx}`, {
                            required: !isEditWrongNumber && idx === 0 ? "Primary phone is required" : false,
                            pattern: {
                              value: /^[6-9]\d{9}$/,
                              message: "10 digit mobile starting with 6-9 only"
                            }
                          })}
                          className={`w-full px-4 py-2 bg-white border rounded-xl text-xs outline-none focus:border-[#162335] ${
                            errors[`phone${idx}`] ? "border-rose-455 bg-rose-50/20" : "border-slate-200"
                          }`}
                        />
                        {watch(`phone${idx}`) && (
                          <button
                            type="button"
                            onClick={() => setValue(`phone${idx}`, "", { shouldValidate: true, shouldDirty: true })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 text-xs px-1 cursor-pointer"
                            title="Clear this number"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {errors[`phone${idx}`] && (
                        <p className="text-[10px] text-rose-500 mt-1 font-bold">
                          {errors[`phone${idx}`].message}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Summary of all active phone numbers for this lead */}
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Numbers on Lead:
                    </span>
                    {(() => {
                      const activeNums = [0, 1, 2, 3]
                        .map((i) => ({ idx: i, num: watch(`phone${i}`) }))
                        .filter((item) => item.num && String(item.num).trim());

                      if (activeNums.length === 0) {
                        return <span className="text-[10px] text-slate-400 italic">No numbers entered</span>;
                      }

                      return activeNums.map(({ idx, num }) => (
                        <span
                          key={idx}
                          onClick={() => setEditActivePhoneIndex(idx)}
                          className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-slate-300 shadow-2xs transition"
                          title={`Click to edit Phone ${idx + 1}`}
                        >
                          <Phone size={9} className="text-slate-400" />
                          <span className="text-slate-400 font-medium">Phone {idx + 1}:</span>
                          <span className="font-mono">{num}</span>
                        </span>
                      ));
                    })()}
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">City {!isEditWrongNumber && "*"}</label>
                  <input 
                    type="text" 
                    {...register("city", { required: !isEditWrongNumber ? "City is required" : false })} 
                    className={`w-full px-4 py-2 border rounded-xl text-xs outline-none focus:border-[#162335] ${errors.city ? "border-rose-455" : "border-slate-200"}`} 
                  />
                  {errors.city && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.city.message}</p>}
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">State {!isEditWrongNumber && "*"}</label>
                  <input 
                    type="text" 
                    {...register("state", { required: !isEditWrongNumber ? "State is required" : false })} 
                    className={`w-full px-4 py-2 border rounded-xl text-xs outline-none focus:border-[#162335] ${errors.state ? "border-rose-455" : "border-slate-200"}`} 
                  />
                  {errors.state && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.state.message}</p>}
                </div>

                {/* Company Turnover */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Company Turnover (₹) <span className="text-slate-400 font-normal text-[11px]">(Optional)</span></label>
                  <input
                    type="number"
                    {...register("companyTurnover", { 
                      required: false,
                      validate: val => !val || parseFloat(val) > 0 || "Turnover must be > 0"
                    })}
                    className={`w-full px-4 py-2 border rounded-xl text-xs outline-none focus:border-[#162335] ${errors.companyTurnover ? "border-rose-455" : "border-slate-200"}`}
                  />
                  {errors.companyTurnover && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.companyTurnover.message}</p>}
                </div>

                {/* Loan Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Loan Amount (₹) {isEditAllMandatory && "*"}</label>
                  <input
                    type="number"
                    {...register("loanAmount", { 
                      required: isEditAllMandatory ? "Loan Amount required" : false,
                      validate: val => !isEditAllMandatory || (!val || parseFloat(val) > 0) || "Loan Amount must be > 0"
                    })}
                    className={`w-full px-4 py-2 border rounded-xl text-xs outline-none focus:border-[#162335] ${errors.loanAmount ? "border-rose-455" : "border-slate-200"}`}
                  />
                  {errors.loanAmount && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.loanAmount.message}</p>}
                </div>

                {/* Loan Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Type of Loan {isEditAllMandatory && "*"}</label>
                  <select
                    {...register("loanType", { required: isEditAllMandatory ? "Loan Type is required" : false })}
                    className={`w-full px-4 py-2 border rounded-xl text-xs outline-none focus:border-[#162335] bg-white ${errors.loanType ? "border-rose-455" : "border-slate-200"}`}
                  >
                    <option value="">Select Loan Type</option>
                    <option value="Property Purchase Loan">Property Purchase Loan</option>
                    <option value="Business Loan">Business Loan</option>
                    <option value="Property Loan">Property Loan</option>
                  </select>
                  {errors.loanType && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.loanType.message}</p>}
                </div>

                {/* Property Loan Category (if Loan Type is Property Loan) */}
                {watch("loanType") === "Property Loan" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Property Loan Category {isEditAllMandatory && "*"}</label>
                    <select
                      {...register("propertyLoanCategory", { required: isEditAllMandatory ? "Property Loan Category is required" : false })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#162335] bg-white"
                    >
                      <option value="">Select Category</option>
                      <option value="Commercial Loan">Commercial Loan</option>
                      <option value="Industrial Loan">Industrial Loan</option>
                      <option value="Residential Loan">Residential Loan</option>
                      <option value="Working Capital">Working Capital</option>
                      <option value="LAP">LAP</option>
                      <option value="Unsold">Unsold</option>
                      <option value="LRD">LRD</option>
                      <option value="NA Plot">NA Plot</option>
                    </select>
                    {errors.propertyLoanCategory && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.propertyLoanCategory.message}</p>}
                  </div>
                )}



                {/* Interested */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Interested *</label>
                  <select
                    {...register("interested", { required: "Interested is required" })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#162335] bg-white"
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
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#162335] bg-white"
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
                  <input type="date" {...register("meetingDate")} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#162335] bg-white" />
                </div>

                {/* Meeting Time */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Meeting Time</label>
                  <input type="time" {...register("meetingTime")} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#162335] bg-white" />
                </div>
              </div>

              {/* Conditional Follow Up */}
              {isEditFollowUp && (
                <div className="border border-amber-200 bg-amber-50/50 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <p className="col-span-full text-xs font-bold text-amber-700 flex items-center gap-1.5"><Clock size={14} /> Update Follow-up Schedule</p>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Follow-up Date *</label>
                    <input type="date" {...register("followUpDate", { required: isEditFollowUp ? "Follow-up Date is required" : false })} className={`w-full px-4 py-2 border rounded-xl text-xs bg-white outline-none focus:border-[#162335] ${errors.followUpDate ? "border-rose-455" : "border-amber-300"}`} />
                    {errors.followUpDate && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.followUpDate.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Follow-up Time *</label>
                    <input type="time" {...register("followUpTime", { required: isEditFollowUp ? "Follow-up Time is required" : false })} className={`w-full px-4 py-2 border rounded-xl text-xs bg-white outline-none focus:border-[#162335] ${errors.followUpTime ? "border-rose-455" : "border-amber-300"}`} />
                    {errors.followUpTime && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.followUpTime.message}</p>}
                  </div>
                </div>
              )}

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Address {isEditAllMandatory && "*"}</label>
                <textarea rows="3" {...register("address", { required: isEditAllMandatory ? "Address is required" : false })} className={`w-full px-4 py-2 border rounded-xl text-xs outline-none focus:border-[#162335] ${errors.address ? "border-rose-455" : "border-slate-200"}`}></textarea>
                {errors.address && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.address.message}</p>}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setEditLead(null)} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold transition text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={submittingEdit} className="px-5 py-2 bg-[#162335] hover:bg-[#153452] text-white font-bold rounded-xl transition text-xs flex items-center gap-1.5">
                  {submittingEdit ? <Loader2 size={14} className="animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Modal */}
      {isManager && deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <h3 className="text-md font-black text-[#162335]">Confirm Delete</h3>
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