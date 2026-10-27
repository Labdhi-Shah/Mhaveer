import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Calendar, Clock, DollarSign, Award, Briefcase, User,
  MapPin, CheckCircle, AlertCircle, Loader2, ArrowRight, ArrowLeft, Eye, Edit2, Trash2, X,
  Building2, Home, Landmark, RefreshCw, FileText, Check, ShieldCheck, FileSpreadsheet,
  Search, ChevronLeft, ChevronRight
} from "lucide-react";
import * as XLSX from "xlsx";
import { downloadXLSX } from "../utils/fileDownloader";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { getMergedLeadsAndStats } from "../utils/hierarchy";
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
  } catch (e) { }
  return timeStr;
};

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    todaysCalls: 0,
    interestedLeads: 0,
    pendingFollowUps: 0,
    todaysMeetings: 0
  });
  const [allLeads, setAllLeads] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Active filter state: "all" | "todaysCalls" | "interestedLeads" | "pendingFollowUps" | "todaysMeetings"
  const [activeCardFilter, setActiveCardFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals for Actions
  const [viewLead, setViewLead] = useState(null);
  const [editLead, setEditLead] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Card Details Popup Modal State
  const [cardModal, setCardModal] = useState(null); // null | "todaysCalls" | "interestedLeads" | "pendingFollowUps" | "todaysMeetings"
  const [modalSearch, setModalSearch] = useState("");
  const [modalPage, setModalPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(10);
  const [modalExporting, setModalExporting] = useState(false);

  // Show toast utility
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [exporting, setExporting] = useState(false);

  // Robust date comparison helper
  const isSameDayOrToday = (dateVal) => {
    if (!dateVal) return false;
    try {
      const now = new Date();
      const todayStrLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const todayStrUTC = now.toISOString().slice(0, 10);
      const dStr = typeof dateVal === "string" ? dateVal.slice(0, 10) : "";
      if (dStr === todayStrLocal || dStr === todayStrUTC) return true;

      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return false;
      const isSameLocal = (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
      const isSameUTC = (
        d.getUTCFullYear() === now.getUTCFullYear() &&
        d.getUTCMonth() === now.getUTCMonth() &&
        d.getUTCDate() === now.getUTCDate()
      );
      return isSameLocal || isSameUTC;
    } catch (e) {
      return false;
    }
  };

  // Filter allLeads for specific card category
  const getCardLeads = (cardType) => {
    if (!allLeads || allLeads.length === 0) return [];
    switch (cardType) {
      case "todaysCalls":
        return allLeads.filter(l => isSameDayOrToday(l.updatedAt) || isSameDayOrToday(l.createdAt));
      case "interestedLeads":
        return allLeads.filter(l => l.interested === "Yes" || l.status === "Interested");
      case "pendingFollowUps":
        return allLeads.filter(l => l.interested === "Call Back Later" || l.callStatus === "Busy" || Boolean(l.followUpDate));
      case "todaysMeetings":
        return allLeads.filter(l => isSameDayOrToday(l.meetingDate));
      default:
        return [];
    }
  };

  const getCardModalConfig = (type = cardModal) => {
    switch (type) {
      case "todaysCalls":
        return {
          id: "todaysCalls",
          title: "Today's Calls",
          subtitle: "Comprehensive list of all calls and lead updates recorded today",
          color: "text-blue-600",
          iconBg: "bg-blue-500/20 text-blue-300",
          badgeBg: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <Phone size={22} />,
          filename: "Todays_Calls"
        };
      case "interestedLeads":
        return {
          id: "interestedLeads",
          title: "Interested Leads",
          subtitle: "All clients and leads who expressed interest in loan services",
          color: "text-emerald-600",
          iconBg: "bg-emerald-500/20 text-emerald-300",
          badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: <Award size={22} />,
          filename: "Interested_Leads"
        };
      case "pendingFollowUps":
        return {
          id: "pendingFollowUps",
          title: "Pending Follow-ups",
          subtitle: "Scheduled follow-up reminders and callback calls pending with clients",
          color: "text-amber-600",
          iconBg: "bg-amber-500/20 text-amber-300",
          badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
          icon: <Clock size={22} />,
          filename: "Pending_FollowUps"
        };
      case "todaysMeetings":
        return {
          id: "todaysMeetings",
          title: "Today's Meetings",
          subtitle: "All client consultation meetings scheduled for today",
          color: "text-purple-600",
          iconBg: "bg-purple-500/20 text-purple-300",
          badgeBg: "bg-purple-100 text-purple-800 border-purple-200",
          icon: <Calendar size={22} />,
          filename: "Todays_Meetings"
        };
      default:
        return null;
    }
  };

  const handleOpenCardModal = (cardId) => {
    setCardModal(cardId);
    setModalSearch("");
    setModalPage(1);
    setModalPageSize(10);
  };

  // Filter allLeads based on activeCardFilter for main table
  const getFilteredLeads = () => {
    switch (activeCardFilter) {
      case "todaysCalls":
        return allLeads.filter(l => isSameDayOrToday(l.updatedAt) || isSameDayOrToday(l.createdAt));
      case "interestedLeads":
        return allLeads.filter(l => l.interested === "Yes" || l.status === "Interested");
      case "pendingFollowUps":
        return allLeads.filter(l => l.interested === "Call Back Later" || l.callStatus === "Busy" || Boolean(l.followUpDate));
      case "todaysMeetings":
        return allLeads.filter(l => isSameDayOrToday(l.meetingDate));
      case "all":
      default:
        return allLeads;
    }
  };

  const getFilterInfo = () => {
    switch (activeCardFilter) {
      case "todaysCalls":
        return {
          title: "Today's Calls Details",
          badge: "Today's Calls",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
          filename: "Todays_Calls"
        };
      case "interestedLeads":
        return {
          title: "Interested Leads Details",
          badge: "Interested Leads",
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
          filename: "Interested_Leads"
        };
      case "pendingFollowUps":
        return {
          title: "Pending Follow-Ups Details",
          badge: "Pending Follow-ups",
          badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
          filename: "Pending_FollowUps"
        };
      case "todaysMeetings":
        return {
          title: "Today's Meetings Details",
          badge: "Today's Meetings",
          badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
          filename: "Todays_Meetings"
        };
      case "all":
      default:
        return {
          title: "Latest Leads Log",
          badge: "Overall View",
          badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
          filename: "Latest_Leads_Log"
        };
    }
  };

  const rawFilteredLeads = getFilteredLeads();
  const filteredLeads = rawFilteredLeads.filter(lead => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (lead.leadId && lead.leadId.toLowerCase().includes(q)) ||
      (lead.companyName && lead.companyName.toLowerCase().includes(q)) ||
      (lead.contactPerson && lead.contactPerson.toLowerCase().includes(q)) ||
      (lead.phone && lead.phone.toLowerCase().includes(q)) ||
      (lead.loanType && lead.loanType.toLowerCase().includes(q)) ||
      (lead.interested && lead.interested.toLowerCase().includes(q)) ||
      (lead.callStatus && lead.callStatus.toLowerCase().includes(q)) ||
      (lead.employeeName && lead.employeeName.toLowerCase().includes(q))
    );
  });

  const totalPages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const displayedLeads = pageSize === "all"
    ? filteredLeads
    : filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCardClick = (cardId) => {
    if (activeCardFilter === cardId) {
      setActiveCardFilter("all");
    } else {
      setActiveCardFilter(cardId);
    }
    setSearchQuery("");
    setCurrentPage(1);
    const el = document.getElementById("leads-log-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleExportExcel = () => {
    if (!filteredLeads || filteredLeads.length === 0) {
      showToast("No leads available to export.", "error");
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

      const filterInfo = getFilterInfo();

      const dataToExport = filteredLeads.map((lead, idx) => ({
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
      XLSX.utils.book_append_sheet(wb, ws, filterInfo.badge.slice(0, 31));

      const dateStr = new Date().toISOString().slice(0, 10);
      downloadXLSX(wb, `${filterInfo.filename}_${dateStr}.xlsx`);

      showToast(`Exported ${dataToExport.length} leads to Excel successfully!`);
    } catch (err) {
      console.error("Export leads error:", err);
      showToast("Failed to export leads to Excel.", "error");
    } finally {
      setExporting(false);
    }
  };

  // Card Modal Derived Filtered Leads
  const cardLeadsRaw = cardModal ? getCardLeads(cardModal) : [];
  const cardLeadsFiltered = cardLeadsRaw.filter((lead) => {
    if (!modalSearch.trim()) return true;
    const q = modalSearch.toLowerCase().trim();
    return (
      (lead.leadId && lead.leadId.toLowerCase().includes(q)) ||
      (lead.companyName && lead.companyName.toLowerCase().includes(q)) ||
      (lead.contactPerson && lead.contactPerson.toLowerCase().includes(q)) ||
      (lead.phone && lead.phone.toLowerCase().includes(q)) ||
      (lead.loanType && lead.loanType.toLowerCase().includes(q)) ||
      (lead.interested && lead.interested.toLowerCase().includes(q)) ||
      (lead.callStatus && lead.callStatus.toLowerCase().includes(q)) ||
      (lead.employeeName && lead.employeeName.toLowerCase().includes(q)) ||
      (lead.city && lead.city.toLowerCase().includes(q)) ||
      (lead.remarks && lead.remarks.toLowerCase().includes(q))
    );
  });

  const modalTotalPages = modalPageSize === "all" ? 1 : Math.max(1, Math.ceil(cardLeadsFiltered.length / (typeof modalPageSize === "number" ? modalPageSize : 10)));
  const modalDisplayedLeads = modalPageSize === "all"
    ? cardLeadsFiltered
    : cardLeadsFiltered.slice((modalPage - 1) * modalPageSize, modalPage * modalPageSize);

  const handleExportCardModalExcel = () => {
    if (!cardLeadsFiltered || cardLeadsFiltered.length === 0) {
      showToast("No leads available to export.", "error");
      return;
    }

    try {
      setModalExporting(true);
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

      const config = getCardModalConfig(cardModal);

      const dataToExport = cardLeadsFiltered.map((lead, idx) => ({
        "Sr No": idx + 1,
        "Lead ID": lead.leadId || `LD-${idx + 1}`,
        "Client Name": lead.contactPerson || "-",
        "Company Name": lead.companyName || "-",
        "Phone Number": lead.phone || lead.phoneNumber || "-",
        "City": lead.city || "-",
        "State": lead.state || "-",
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
        "Employee Name (Caller)": lead.employeeName || "-",
        "Employee Code": lead.employeeCode || lead.employeeId || "-",
        "Created Date": formatDate(lead.createdAt)
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const colWidths = Object.keys(dataToExport[0] || {}).map((key) => {
        const maxContentLength = Math.max(
          key.length,
          ...dataToExport.map((row) => String(row[key] !== undefined && row[key] !== null ? row[key] : "").length).slice(0, 50)
        );
        return { wch: Math.min(Math.max(maxContentLength + 3, 12), 40) };
      });
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, (config?.title || "Leads").slice(0, 31));

      const dateStr = new Date().toISOString().slice(0, 10);
      downloadXLSX(wb, `${config?.filename || "Leads"}_${dateStr}.xlsx`);

      showToast(`Exported ${dataToExport.length} leads to Excel successfully!`);
    } catch (err) {
      console.error("Export modal leads error:", err);
      showToast("Failed to export leads to Excel.", "error");
    } finally {
      setModalExporting(false);
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

  // Fetch Dashboard Stats and Leads
  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setStatsLoading(true);
        setRecentLoading(true);
      }

      const [statsRes, leadsRes] = await Promise.all([
        api.get("/leads/stats"),
        api.get("/leads?limit=2000")
      ]);

      const ownStats = statsRes.data.success ? statsRes.data.data : { todaysCalls: 0, interestedLeads: 0, pendingFollowUps: 0, todaysMeetings: 0 };
      const ownLeadsRaw = leadsRes.data.success ? leadsRes.data.data : [];
      const ownLeads = ownLeadsRaw.map(lead => ({
        ...lead,
        phone: lead.phoneNumber || lead.phone,
        companyTurnover: lead.companyTurnover !== undefined ? lead.companyTurnover : lead.yearlyIncome,
        address: lead.address || "",
        remarks: lead.remarks || ""
      }));

      const { leads: mergedLeads, stats: mergedStats } = await getMergedLeadsAndStats(user, ownLeads, ownStats);

      setStats(mergedStats);
      setAllLeads(mergedLeads);
      setRecentLeads(mergedLeads.slice(0, 10));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      showToast(error.response?.data?.message || "Failed to load dashboard data.", "error");
    } finally {
      if (showLoading) {
        setStatsLoading(false);
        setRecentLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();

    if (!socket.connected) {
      socket.connect();
    }

    const handleUpdate = (payload) => {
      if (payload && payload.entity === "lead") {
        if (payload.action === "create" && payload.data) {
          const lead = payload.data;
          const formatted = {
            ...lead,
            phone: lead.phoneNumber || lead.phone,
            companyTurnover: lead.companyTurnover !== undefined ? lead.companyTurnover : lead.yearlyIncome,
            address: lead.address || "",
            remarks: lead.remarks || ""
          };
          setAllLeads((prev) => [formatted, ...prev.filter((l) => l._id !== formatted._id)]);
          setRecentLeads((prev) => [formatted, ...prev.filter((l) => l._id !== formatted._id)].slice(0, 10));
          setStats((prev) => ({
            ...prev,
            todaysCalls: (prev.todaysCalls || 0) + 1,
            interestedLeads: (lead.status === "Interested" || lead.interested) ? (prev.interestedLeads || 0) + 1 : prev.interestedLeads
          }));
        } else if (payload.action === "delete" && payload.id) {
          setAllLeads((prev) => prev.filter((l) => l._id !== payload.id));
          setRecentLeads((prev) => prev.filter((l) => l._id !== payload.id));
        } else if (payload.action === "update" && payload.data) {
          const updated = payload.data;
          const updater = (l) => l._id === updated._id ? {
            ...l,
            ...updated,
            phone: updated.phoneNumber || updated.phone || l.phone,
            companyTurnover: updated.companyTurnover !== undefined ? updated.companyTurnover : l.companyTurnover,
            address: updated.address !== undefined ? updated.address : l.address,
            remarks: updated.remarks !== undefined ? updated.remarks : l.remarks
          } : l;
          setAllLeads((prev) => prev.map(updater));
          setRecentLeads((prev) => prev.map(updater));
        }
      }
      fetchData(false);
    };

    const handleLeadCreated = (data) => handleUpdate({ entity: "lead", action: "create", data });
    const handleLeadUpdated = (data) => handleUpdate({ entity: "lead", action: "update", data });
    const handleLeadDeleted = (id) => handleUpdate({ entity: "lead", action: "delete", id });
    const handleGeneralRefresh = () => fetchData(false);

    socket.on("data-updated", handleUpdate);
    socket.on("leads-updated", handleUpdate);
    socket.on("lead:created", handleLeadCreated);
    socket.on("lead:updated", handleLeadUpdated);
    socket.on("lead:deleted", handleLeadDeleted);
    socket.on("meetings-updated", handleGeneralRefresh);
    socket.on("meeting:created", handleGeneralRefresh);
    socket.on("meeting:updated", handleGeneralRefresh);
    socket.on("meeting:deleted", handleGeneralRefresh);

    return () => {
      socket.off("data-updated", handleUpdate);
      socket.off("leads-updated", handleUpdate);
      socket.off("lead:created", handleLeadCreated);
      socket.off("lead:updated", handleLeadUpdated);
      socket.off("lead:deleted", handleLeadDeleted);
      socket.off("meetings-updated", handleGeneralRefresh);
      socket.off("meeting:created", handleGeneralRefresh);
      socket.off("meeting:updated", handleGeneralRefresh);
      socket.off("meeting:deleted", handleGeneralRefresh);
    };
  }, [user]);


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
            className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${toast.type === "success"
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

      {/* Top Welcome Card removed as requested */}
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            id: "todaysCalls",
            title: "Today's Calls",
            value: stats.todaysCalls !== undefined ? stats.todaysCalls : getCardLeads("todaysCalls").length,
            color: "border-t-[#162335]",
            iconBg: "bg-blue-50 text-[#162335]",
            icon: <Phone size={22} />,
            subtitle: "Click to view call details"
          },
          {
            id: "interestedLeads",
            title: "Interested Leads",
            value: stats.interestedLeads !== undefined ? stats.interestedLeads : getCardLeads("interestedLeads").length,
            color: "border-t-emerald-500",
            iconBg: "bg-emerald-50 text-emerald-600",
            icon: <Award size={22} />,
            subtitle: "Click to view interested leads"
          },
          {
            id: "pendingFollowUps",
            title: "Pending Follow-ups",
            value: stats.pendingFollowUps !== undefined ? stats.pendingFollowUps : getCardLeads("pendingFollowUps").length,
            color: "border-t-[#9ca3af]",
            iconBg: "bg-amber-50 text-[#9ca3af]",
            icon: <Clock size={22} />,
            subtitle: "Click to view pending follow-ups"
          },
          {
            id: "todaysMeetings",
            title: "Today's Meetings",
            value: stats.todaysMeetings !== undefined ? stats.todaysMeetings : getCardLeads("todaysMeetings").length,
            color: "border-t-purple-500",
            iconBg: "bg-purple-50 text-purple-600",
            icon: <Calendar size={22} />,
            subtitle: "Click to view today's meetings"
          }
        ].map((card) => (
          <div
            key={card.id}
            onClick={() => handleOpenCardModal(card.id)}
            className={`bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-t-4 ${card.color} flex items-center justify-between cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 active:scale-[0.98] transition-all duration-200 group relative select-none`}
            title={`Click to view all ${card.title} details`}
          >
            <div>
              <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wide group-hover:text-slate-600 transition">
                {card.title}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#162335] mt-1 group-hover:scale-105 transition-transform origin-left">
                {statsLoading ? (
                  <Loader2 className="animate-spin text-slate-300" size={24} />
                ) : (
                  card.value
                )}
              </h2>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${card.iconBg} group-hover:scale-110 transition-transform shadow-xs`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Layout for CRM Actions and Leads Table */}
      <div className="space-y-6">
        {/* Follow-Ups & Meetings Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Follow-Ups */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between h-fit w-full">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-md font-black text-[#162335] flex items-center gap-2">
                  <Clock size={18} className="text-amber-500" />
                  Upcoming Follow-Ups
                </h3>
              </div>

              {recentLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="animate-spin text-[#162335]" size={28} />
                </div>
              ) : recentLeads.filter(l => l.followUpDate).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No upcoming follow-ups.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLeads.filter(l => l.followUpDate).slice(0, 5).map((lead) => (
                    <div key={lead._id} className="p-3 bg-amber-50/50 hover:bg-amber-50 border border-amber-100/50 rounded-2xl flex flex-col justify-between gap-2 transition cursor-pointer" onClick={() => setViewLead(lead)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] font-black text-slate-400">{lead.leadId}</span>
                        <span className="text-[10px] font-extrabold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                          {formatFriendlyDate(lead.followUpDate)} {lead.followUpTime ? `| ${formatFriendlyTime(lead.followUpTime)}` : ''}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-[#162335] truncate">{lead.companyName}</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Contact: {lead.contactPerson} ({lead.phone})</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Meetings */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between h-fit w-full">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-md font-black text-[#162335] flex items-center gap-2">
                  <Calendar size={18} className="text-[#162335]" />
                  Upcoming Meetings
                </h3>
              </div>

              {recentLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="animate-spin text-[#162335]" size={28} />
                </div>
              ) : recentLeads.filter(l => l.meetingDate).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No upcoming meetings.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLeads.filter(l => l.meetingDate).slice(0, 5).map((lead) => (
                    <div key={lead._id} className="p-3 bg-blue-50/50 hover:bg-blue-50 border border-blue-100/50 rounded-2xl flex flex-col justify-between gap-2 transition cursor-pointer" onClick={() => setViewLead(lead)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] font-black text-slate-400">{lead.leadId}</span>
                        <span className="text-[10px] font-extrabold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                          {formatFriendlyDate(lead.meetingDate)} {lead.meetingTime ? `| ${formatFriendlyTime(lead.meetingTime)}` : ''}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-[#162335] truncate">{lead.companyName}</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Contact: {lead.contactPerson} ({lead.phone})</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Latest Leads Log */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h3 className="text-lg font-black text-[#162335]">Latest Leads Log</h3>
            <button
              onClick={handleExportExcel}
              disabled={recentLoading || recentLeads.length === 0 || exporting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
              title="Export Latest Leads Log to Excel"
            >
              {exporting ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
              <span>Export in Excel</span>
            </button>
          </div>

          {recentLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#162335]" size={28} /></div>
          ) : recentLeads.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">No leads logged.</div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-[#162335] text-white font-extrabold uppercase whitespace-nowrap">
                    <th className="py-3 px-4 rounded-l-xl">LEAD ID</th>
                    <th className="py-3 px-4">COMPANY NAME</th>
                    <th className="py-3 px-4">CONTACT PERSON</th>
                    <th className="py-3 px-4">PHONE NUMBER</th>
                    <th className="py-3 px-4">LOAN TYPE</th>
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
                      <td className="py-3.5 px-4 font-mono font-black text-[#162335]">{lead.leadId}</td>
                      <td className="py-3.5 px-4 font-bold text-[#162335]">{lead.companyName}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{lead.contactPerson}</td>
                      <td className="py-3.5 px-4 text-slate-600">{lead.phone}</td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-500">{lead.loanType}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black ${lead.interested === "Yes" ? "bg-emerald-100 text-emerald-800" :
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
                            onClick={() => handleOpenViewLead(lead)}
                            className="p-1.5 text-slate-500 hover:text-[#162335] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="View Total Details"
                          >
                            <Eye size={15} />
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
      </div>

      {/* Action Modals */}
      {/* 0. Card Details Popup Modal */}
      <AnimatePresence>
        {cardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 print:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCardModal(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden z-50"
            >
              {/* Header */}
              <div className="bg-[#162335] text-white px-6 py-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10 shadow-sm shrink-0">
                    {getCardModalConfig(cardModal)?.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                        {getCardModalConfig(cardModal)?.title}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/20 text-white border border-white/20">
                        {cardLeadsFiltered.length} {cardLeadsFiltered.length === 1 ? "Record" : "Records"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      {getCardModalConfig(cardModal)?.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={handleExportCardModalExcel}
                    disabled={modalExporting || cardLeadsFiltered.length === 0}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    title="Export list to Excel"
                  >
                    {modalExporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                    <span className="hidden sm:inline">Export in Excel</span>
                  </button>
                  <button
                    onClick={() => setCardModal(null)}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                <div className="relative flex-1 max-w-md">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={(e) => {
                      setModalSearch(e.target.value);
                      setModalPage(1);
                    }}
                    placeholder="Search by client name, company, phone, loan type, caller..."
                    className="w-full pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#162335] focus:ring-1 focus:ring-[#162335] transition"
                  />
                  {modalSearch && (
                    <button
                      onClick={() => setModalSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end text-xs">
                  <span className="text-slate-500 font-medium">
                    Showing <span className="font-extrabold text-[#162335]">{modalDisplayedLeads.length}</span> of <span className="font-extrabold text-[#162335]">{cardLeadsFiltered.length}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-bold text-[11px]">Rows:</span>
                    <select
                      value={modalPageSize}
                      onChange={(e) => {
                        const val = e.target.value === "all" ? "all" : Number(e.target.value);
                        setModalPageSize(val);
                        setModalPage(1);
                      }}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value="all">All</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Body / Table */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                {cardLeadsFiltered.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <Search size={24} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700">No matching leads found</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {modalSearch ? "Try searching with a different term." : "There are currently no leads logged under this category."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                    <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                      <thead>
                        <tr className="bg-[#162335] text-white font-extrabold uppercase whitespace-nowrap text-[11px]">
                          <th className="py-3 px-3.5 text-center w-12">#</th>
                          <th className="py-3 px-3.5">LEAD ID</th>
                          <th className="py-3 px-4">CLIENT NAME</th>
                          <th className="py-3 px-4">COMPANY NAME</th>
                          <th className="py-3 px-4">PHONE NUMBER</th>
                          <th className="py-3 px-4">LOAN DETAILS</th>
                          <th className="py-3 px-4 text-center">
                            {cardModal === "todaysMeetings" ? "MEETING TIME" :
                             cardModal === "pendingFollowUps" ? "FOLLOW-UP" :
                             cardModal === "interestedLeads" ? "INTERESTED" :
                             "CALL STATUS"}
                          </th>
                          <th className="py-3 px-4">EMPLOYEE (CALLER)</th>
                          <th className="py-3 px-4">REMARKS</th>
                          <th className="py-3 px-4 text-center">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-slate-700 whitespace-nowrap bg-white">
                        {modalDisplayedLeads.map((lead, idx) => {
                          const rowNumber = modalPageSize === "all" ? idx + 1 : (modalPage - 1) * modalPageSize + idx + 1;
                          return (
                            <tr key={lead._id || idx} className="hover:bg-blue-50/40 transition">
                              <td className="py-3 px-3.5 text-center font-bold text-slate-400">{rowNumber}</td>
                              <td className="py-3 px-3.5 font-mono font-black text-[#162335]">
                                <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                                  {lead.leadId || "-"}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-black text-slate-900 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-[#162335]/10 text-[#162335] flex items-center justify-center font-black text-xs shrink-0">
                                    {(lead.contactPerson || "C").charAt(0).toUpperCase()}
                                  </div>
                                  <span className="truncate max-w-[160px]">{lead.contactPerson || "-"}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-700 truncate max-w-[180px]">
                                {lead.companyName || "-"}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-600">
                                {lead.phone ? (
                                  <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline flex items-center gap-1 font-mono">
                                    <Phone size={12} className="text-slate-400" />
                                    {lead.phone}
                                  </a>
                                ) : "-"}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-extrabold text-slate-800">{lead.loanType || "-"}</div>
                                {lead.loanAmount ? (
                                  <div className="text-[11px] font-bold text-emerald-700">{formatINR(lead.loanAmount)}</div>
                                ) : null}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {cardModal === "todaysMeetings" ? (
                                  <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-extrabold">
                                    {lead.meetingTime ? formatFriendlyTime(lead.meetingTime) : "Scheduled"}
                                  </span>
                                ) : cardModal === "pendingFollowUps" ? (
                                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-extrabold">
                                    {lead.followUpDate ? formatFriendlyDate(lead.followUpDate) : "Callback"} {lead.followUpTime ? `(${formatFriendlyTime(lead.followUpTime)})` : ""}
                                  </span>
                                ) : cardModal === "interestedLeads" ? (
                                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black">
                                    {lead.interested || "Yes"}
                                  </span>
                                ) : (
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                    lead.callStatus === "Connected" ? "bg-emerald-100 text-emerald-800" :
                                    lead.callStatus === "Busy" ? "bg-amber-100 text-amber-800" :
                                    "bg-slate-100 text-slate-700"
                                  }`}>
                                    {lead.callStatus || "Logged"}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-700">{lead.employeeName || "-"}</span>
                                {lead.employeeCode ? (
                                  <span className="text-[10px] text-slate-400 block font-mono">{lead.employeeCode}</span>
                                ) : null}
                              </td>
                              <td className="py-3 px-4 max-w-[180px] truncate text-slate-500 font-medium" title={lead.remarks || ""}>
                                {lead.remarks || "-"}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleOpenViewLead(lead)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#162335] hover:bg-[#162335]/90 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                                  title="View full lead details"
                                >
                                  <Eye size={13} />
                                  <span>View</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Sticky Footer */}
              <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-slate-500 font-medium">
                  {modalTotalPages > 1 ? (
                    <span>
                      Page <span className="font-bold text-[#162335]">{modalPage}</span> of <span className="font-bold text-[#162335]">{modalTotalPages}</span>
                    </span>
                  ) : (
                    <span>Showing all {cardLeadsFiltered.length} records</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {modalTotalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setModalPage((p) => Math.max(1, p - 1))}
                        disabled={modalPage === 1}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        title="Previous page"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="px-3 py-1 text-xs font-bold text-slate-700">
                        {modalPage} / {modalTotalPages}
                      </span>
                      <button
                        onClick={() => setModalPage((p) => Math.min(modalTotalPages, p + 1))}
                        disabled={modalPage === modalTotalPages}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        title="Next page"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setCardModal(null)}
                    className="px-5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1. View Lead Details Modal */}
      {viewLead && (
        <div style={{ zIndex: 1000 }} className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 print:hidden">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewLead(null)}
            style={{ zIndex: 1001 }}
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            style={{ zIndex: 1002 }}
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden relative"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#162335] text-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
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
                {cardModal && (
                  <button
                    onClick={() => setViewLead(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Back to list"
                  >
                    <ArrowLeft size={14} />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                )}
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${viewLead.interested === "Yes"
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
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document List</span>
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
                <div className={`bg-white rounded-2xl p-5 border shadow-xs space-y-3 ${viewLead.followUpDate ? "border-amber-200/70" : "border-slate-200/80"
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

      {/* 2. Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{ zIndex: 2000 }} className="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
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
