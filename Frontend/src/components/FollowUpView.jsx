import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, Phone, Loader2, Calendar, AlertCircle, CheckCircle, Eye, X, Search, 
  Building2, User, UserCheck, DollarSign, MapPin, FileText, ChevronDown, Check, Briefcase, 
  ShieldCheck, ArrowRight, ThumbsUp, ThumbsDown, Filter
} from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { getMergedLeadsAndStats, getUserRole } from "../utils/hierarchy";
import socket from "../utils/socket";

const formatFriendlyDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateStr;
  }
};

const formatFriendlyTime = (timeStr) => {
  if (!timeStr) return "";
  const hhmm = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    let hh = parseInt(hhmm[1], 10);
    const mm = hhmm[2];
    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12;
    hh = hh ? hh : 12;
    return `${hh}:${mm} ${ampm}`;
  }
  return timeStr;
};

const getTurnoverInINR = (amount, unit) => {
  if (!amount || isNaN(parseFloat(amount))) return null;
  const num = parseFloat(amount);
  if (num <= 0) return null;
  let inr = num;
  if (unit === "Cr") inr = num * 10000000;
  else if (unit === "Lakhs") inr = num * 100000;
  return Math.round(inr);
};

export default function FollowUpView() {
  const { user } = useAuth();
  const role = getUserRole(user);
  const isManager = role === "Manager";

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("All");
  const [toast, setToast] = useState(null);

  // Modals state
  const [convertingLead, setConvertingLead] = useState(null);
  const [submittingConvert, setSubmittingConvert] = useState(false);
  const [notInterestedLead, setNotInterestedLead] = useState(null);
  const [notInterestedRemarks, setNotInterestedRemarks] = useState("");
  const [submittingNotInterested, setSubmittingNotInterested] = useState(false);
  const [viewingLead, setViewingLead] = useState(null);

  // Conversion Form Hook
  const {
    register: registerConvert,
    handleSubmit: handleSubmitConvert,
    watch: watchConvert,
    setValue: setValueConvert,
    reset: resetConvert,
    clearErrors: clearErrorsConvert,
    formState: { errors: errorsConvert }
  } = useForm();

  const convertLoanType = watchConvert("loanType");
  const convertPropertyLoanCategory = watchConvert("propertyLoanCategory");
  const convertLapPropertyType = watchConvert("lapPropertyType");
  const convertBusinessLoanType = watchConvert("businessLoanType");
  const convertUnsoldBV = watchConvert("unsoldBV");
  const convertNaPlotVacant = watchConvert("naPlotVacant");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchFollowups = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get("/leads?limit=1000");
      if (res.data.success) {
        const ownLeads = res.data.data.map(lead => ({
          ...lead,
          phone: lead.phoneNumber || lead.phone,
          companyTurnover: lead.companyTurnover !== undefined ? lead.companyTurnover : lead.yearlyIncome,
          address: lead.address !== undefined ? lead.address : lead.remarks
        }));
        const ownStats = { todaysCalls: 0, interestedLeads: 0, pendingFollowUps: 0, todaysMeetings: 0 };
        const { leads: mergedLeads } = await getMergedLeadsAndStats(user, ownLeads, ownStats);

        // Filter only leads pending follow-up (Call Back Later or Busy) that haven't been completed
        const followUpLeads = mergedLeads.filter(
          lead => (lead.interested === "Call Back Later" || lead.callStatus === "Busy") && lead.interested !== "Yes" && lead.interested !== "No"
        );
        setLeads(followUpLeads);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch follow-ups.", "error");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();

    if (!socket.connected) {
      socket.connect();
    }

    const handleUpdate = () => {
      fetchFollowups(false);
    };

    socket.on("data-updated", handleUpdate);
    socket.on("leads-updated", handleUpdate);
    socket.on("lead:created", handleUpdate);
    socket.on("lead:updated", handleUpdate);
    socket.on("lead:deleted", handleUpdate);

    return () => {
      socket.off("data-updated", handleUpdate);
      socket.off("leads-updated", handleUpdate);
      socket.off("lead:created", handleUpdate);
      socket.off("lead:updated", handleUpdate);
      socket.off("lead:deleted", handleUpdate);
    };
  }, [user]);

  // Open "Interested" Lead Conversion Modal
  const openConvertModal = (lead) => {
    setConvertingLead(lead);

    let initialTurnoverAmt = "";
    let initialTurnoverUnit = "Cr";
    if (lead.companyTurnover && lead.companyTurnover > 0) {
      if (lead.companyTurnover >= 10000000) {
        initialTurnoverAmt = (lead.companyTurnover / 10000000).toString();
        initialTurnoverUnit = "Cr";
      } else if (lead.companyTurnover >= 100000) {
        initialTurnoverAmt = (lead.companyTurnover / 100000).toString();
        initialTurnoverUnit = "Lakhs";
      } else {
        initialTurnoverAmt = lead.companyTurnover.toString();
        initialTurnoverUnit = "Rupees";
      }
    }

    let initialLoanAmt = "";
    let initialLoanUnit = "Cr";
    if (lead.loanAmount && lead.loanAmount > 0) {
      if (lead.loanAmount >= 10000000) {
        initialLoanAmt = (lead.loanAmount / 10000000).toString();
        initialLoanUnit = "Cr";
      } else if (lead.loanAmount >= 100000) {
        initialLoanAmt = (lead.loanAmount / 100000).toString();
        initialLoanUnit = "Lakhs";
      } else {
        initialLoanAmt = lead.loanAmount.toString();
        initialLoanUnit = "Rupees";
      }
    }

    resetConvert({
      companyName: lead.companyName || "",
      contactPerson: lead.contactPerson || "",
      phone: lead.phone || lead.phoneNumber || "",
      city: lead.city || "",
      state: lead.state || "",
      turnoverAmount: initialTurnoverAmt,
      turnoverUnit: initialTurnoverUnit,
      loanAmountInput: initialLoanAmt,
      loanAmountUnit: initialLoanUnit,
      loanType: lead.loanType || "",
      propertyPurchaseCategory: lead.propertyPurchaseCategory || "",
      ppLocation: lead.ppLocation || "",
      ppMarketRate: lead.ppMarketRate || "",
      ppDastavejRate: lead.ppDastavejRate || "",
      ppDastavejName: lead.ppDastavejName || "",
      propertyLoanCategory: lead.propertyLoanCategory || "",
      propertyLocation: lead.propertyLocation || "",
      durationOfRentProperty: lead.durationOfRentProperty || "",
      lapPropertyType: lead.lapPropertyType || "",
      lapPropertyLocation: lead.lapPropertyLocation || "",
      lapPropertyMarketValue: lead.lapPropertyMarketValue || "",
      lapPropertyWork: lead.lapPropertyWork || "",
      lapPropertyDocumentList: lead.lapPropertyDocumentList || "",
      unsoldUnit: lead.unsoldUnit || "",
      unsoldMV: lead.unsoldMV || "",
      unsoldBV: lead.unsoldBV !== undefined ? lead.unsoldBV : false,
      unsoldScheme: lead.unsoldScheme || "",
      unsoldLocation: lead.unsoldLocation || "",
      unsoldFloor: lead.unsoldFloor || "",
      unsoldDastavej: lead.unsoldDastavej || "",
      unsoldPartnership: lead.unsoldPartnership || "",
      lrdRent: lead.lrdRent || "",
      lrdMarketValue: lead.lrdMarketValue || "",
      lrdLocation: lead.lrdLocation || "",
      lrdLoiYear: lead.lrdLoiYear || "",
      lrdSchemeName: lead.lrdSchemeName || "",
      lrdDastavej: lead.lrdDastavej || "",
      naPlotLocation: lead.naPlotLocation || "",
      naPlotMV: lead.naPlotMV || "",
      naPlotDastavej: lead.naPlotDastavej || "",
      naPlotVAR: lead.naPlotVAR || "",
      naPlotScheme: lead.naPlotScheme || "",
      naPlotVacant: lead.naPlotVacant !== undefined ? lead.naPlotVacant : false,
      businessLoanType: lead.businessLoanType || "",
      businessStartingYear: lead.businessStartingYear || "",
      businessTypeOfWork: lead.businessTypeOfWork || "",
      btBankName: lead.btBankName || "",
      btRateOfInterest: lead.btRateOfInterest || "",
      btPropertyType: lead.btPropertyType || "",
      btMarketValue: lead.btMarketValue || "",
      btLocation: lead.btLocation || "",
      btDuration: lead.btDuration || "",
      btOutstanding: lead.btOutstanding || "",
      btForeclosureCharge: lead.btForeclosureCharge || "",
      meetingDate: "",
      meetingTime: "11:00",
      address: lead.address || "",
      remarks: lead.remarks || ""
    });
  };

  // Submit Conversion to Interested with Full Details & Schedule Meeting
  const onConvertLeadSubmit = async (data) => {
    if (!convertingLead) return;
    setSubmittingConvert(true);
    try {
      if (data.meetingDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const meetD = new Date(data.meetingDate);
        if (meetD < today) {
          showToast("Meeting date cannot be in the past.", "error");
          setSubmittingConvert(false);
          return;
        }
      }

      const turnoverINR = getTurnoverInINR(data.turnoverAmount, data.turnoverUnit || "Cr");
      const loanAmountINR = getTurnoverInINR(data.loanAmountInput, data.loanAmountUnit || "Cr");

      const payload = {
        ...convertingLead,
        ...data,
        interested: "Yes",
        callStatus: "Connected",
        companyTurnover: turnoverINR !== null ? turnoverINR : (convertingLead.companyTurnover ? parseFloat(convertingLead.companyTurnover) : undefined),
        loanAmount: loanAmountINR !== null ? loanAmountINR : (convertingLead.loanAmount ? parseFloat(convertingLead.loanAmount) : undefined),
        meetingDate: data.meetingDate,
        meetingTime: data.meetingTime,
        address: data.address,
        remarks: data.remarks
      };

      // Clean up conversion form specific temporary fields
      delete payload.turnoverAmount;
      delete payload.turnoverUnit;
      delete payload.loanAmountInput;
      delete payload.loanAmountUnit;
      // Follow-up is now resolved, remove followUpDate and followUpTime
      delete payload.followUpDate;
      delete payload.followUpTime;

      // Clean up unneeded loan category fields based on selected loanType
      if (payload.loanType !== "Property Purchase Loan") {
        delete payload.propertyPurchaseCategory;
        delete payload.ppLocation;
        delete payload.ppMarketRate;
        delete payload.ppDastavejRate;
        delete payload.ppDastavejName;
      }
      if (payload.loanType !== "Property Loan") {
        delete payload.propertyLoanCategory;
        delete payload.propertyLocation;
        delete payload.durationOfRentProperty;
      } else if (!["Working Capital"].includes(payload.propertyLoanCategory)) {
        delete payload.propertyLocation;
        delete payload.durationOfRentProperty;
      }
      if (payload.propertyLoanCategory !== "LAP") {
        delete payload.lapPropertyType;
        delete payload.lapPropertyLocation;
        delete payload.lapPropertyMarketValue;
        delete payload.lapPropertyWork;
        delete payload.lapPropertyDocumentList;
      }
      if (payload.propertyLoanCategory !== "Unsold") {
        delete payload.unsoldUnit;
        delete payload.unsoldMV;
        delete payload.unsoldBV;
        delete payload.unsoldScheme;
        delete payload.unsoldLocation;
        delete payload.unsoldFloor;
        delete payload.unsoldDastavej;
        delete payload.unsoldPartnership;
      }
      if (payload.propertyLoanCategory !== "LRD") {
        delete payload.lrdRent;
        delete payload.lrdMarketValue;
        delete payload.lrdLocation;
        delete payload.lrdLoiYear;
        delete payload.lrdSchemeName;
        delete payload.lrdDastavej;
      }
      if (payload.propertyLoanCategory !== "NA Plot") {
        delete payload.naPlotLocation;
        delete payload.naPlotMV;
        delete payload.naPlotYesNo;
        delete payload.naPlotDastavej;
        delete payload.naPlotVAR;
        delete payload.naPlotScheme;
        delete payload.naPlotLavani;
        delete payload.naPlotVacant;
      }
      if (payload.loanType !== "Business Loan") {
        delete payload.businessLoanType;
        delete payload.businessStartingYear;
        delete payload.businessTypeOfWork;
      }
      if (payload.loanType !== "Balance Transfer") {
        delete payload.btBankName;
        delete payload.btRateOfInterest;
        delete payload.btPropertyType;
        delete payload.btMarketValue;
        delete payload.btLocation;
        delete payload.btDuration;
        delete payload.btOutstanding;
        delete payload.btForeclosureCharge;
      }

      const res = await api.put(`/leads/${convertingLead._id}`, payload);
      if (res.data.success) {
        showToast("Lead converted to Interested! Meeting scheduled with Sales department.", "success");
        setConvertingLead(null);
        fetchFollowups();
      }
    } catch (err) {
      console.error("Convert Lead Error:", err);
      showToast(err.response?.data?.message || "Failed to convert lead.", "error");
    } finally {
      setSubmittingConvert(false);
    }
  };

  // Submit Not Interested Confirmation
  const onNotInterestedSubmit = async () => {
    if (!notInterestedLead) return;
    setSubmittingNotInterested(true);
    try {
      const payload = {
        ...notInterestedLead,
        interested: "No",
        callStatus: "Connected",
        remarks: notInterestedRemarks 
          ? `${notInterestedLead.remarks ? notInterestedLead.remarks + " | " : ""}[Not Interested]: ${notInterestedRemarks}`
          : notInterestedLead.remarks
      };
      delete payload.followUpDate;
      delete payload.followUpTime;

      const res = await api.put(`/leads/${notInterestedLead._id}`, payload);
      if (res.data.success) {
        showToast("Lead updated to 'Not Interested'.", "success");
        setNotInterestedLead(null);
        setNotInterestedRemarks("");
        fetchFollowups();
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update status.", "error");
    } finally {
      setSubmittingNotInterested(false);
    }
  };

  const getLeadEmployee = (lead) => {
    const name =
      lead?.employeeName ||
      (typeof lead?.employeeId === "object" ? lead?.employeeId?.name : null) ||
      (lead?.createdBy && lead?.createdBy !== "System" ? lead?.createdBy : null) ||
      "Unassigned";
    const code =
      lead?.employeeCode ||
      (typeof lead?.employeeId === "object" ? lead?.employeeId?.employeeId : null) ||
      "";
    const email =
      lead?.officialEmail ||
      (typeof lead?.employeeId === "object" ? lead?.employeeId?.officialEmail : null) ||
      "";
    return { name, code, email };
  };

  const employeeOptions = useMemo(() => {
    const set = new Set();
    leads.forEach((l) => {
      const emp = getLeadEmployee(l);
      if (emp.name && emp.name !== "Unassigned" && emp.name !== "System") {
        set.add(emp.name);
      }
    });
    return Array.from(set).sort();
  }, [leads]);

  // Filtered Leads
  const filteredLeads = leads.filter(lead => {
    const emp = getLeadEmployee(lead);
    if (selectedEmployee !== "All" && emp.name !== selectedEmployee) {
      return false;
    }
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (lead.companyName || "").toLowerCase().includes(s) ||
      (lead.contactPerson || "").toLowerCase().includes(s) ||
      (lead.leadId || "").toLowerCase().includes(s) ||
      (lead.phone || "").toLowerCase().includes(s) ||
      (lead.city || "").toLowerCase().includes(s) ||
      emp.name.toLowerCase().includes(s) ||
      emp.code.toLowerCase().includes(s)
    );
  });

  const turnoverCalculatedINR = getTurnoverInINR(watchConvert("turnoverAmount"), watchConvert("turnoverUnit") || "Cr");
  const loanCalculatedINR = getTurnoverInINR(watchConvert("loanAmountInput"), watchConvert("loanAmountUnit") || "Cr");

  const todayStr = new Date().toISOString().split("T")[0];

  const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#162335] focus:bg-white rounded-xl text-xs font-semibold text-slate-800 outline-none transition";
  const labelClass = "block text-xs font-black text-slate-700 mb-1";

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border ${
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
            <span className="text-xs font-black tracking-wide">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-amber-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#162335] flex items-center gap-2.5">
            <Clock className="text-amber-500" size={26} />
            Pending CRM Follow-ups
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Review and callback leads who requested "Call Back Later". Converting to <span className="text-emerald-700 font-black">Interested</span> prompts for full loan details and schedules a sales meeting.
          </p>
        </div>

        {/* Search & Employee Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 min-w-[280px]">
          {/* Employee Filter */}
          {employeeOptions.length > 0 && (
            <div className="relative">
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 pr-9 text-xs font-bold text-slate-700 outline-none focus:border-[#162335] cursor-pointer"
              >
                <option value="All">All Employees ({leads.length})</option>
                {employeeOptions.map(name => {
                  const count = leads.filter(l => getLeadEmployee(l).name === name).length;
                  return (
                    <option key={name} value={name}>
                      {name} ({count})
                    </option>
                  );
                })}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}

          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company, contact, employee..."
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 outline-none focus:border-[#162335] focus:bg-white transition"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Leads Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="animate-spin text-[#162335]" size={36} />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Follow-ups...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-sm space-y-2">
          <Clock className="mx-auto text-slate-300" size={40} />
          <p className="font-bold text-slate-600 text-sm">No pending follow-ups found</p>
          <p className="text-slate-400">
            {search ? "No follow-up leads matched your search query." : "All follow-ups have been completed. Excellent work!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <div 
              key={lead._id} 
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition duration-300"
            >
              <div className="space-y-3.5">
                {/* Top ID & Badge */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="font-mono text-[11px] font-black text-[#162335] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                    {lead.leadId || "LEAD"}
                  </span>
                  <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={12} className="text-amber-600" /> Call Back
                  </span>
                </div>

                {/* Company & Contact */}
                <div>
                  <h3 className="text-sm font-black text-[#162335] leading-snug">{lead.companyName}</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5 flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" /> {lead.contactPerson}
                  </p>
                </div>

                {/* Employee / Agent Name */}
                {(() => {
                  const emp = getLeadEmployee(lead);
                  return (
                    <div className="flex items-center justify-between text-xs bg-purple-50/70 border border-purple-100 p-2.5 rounded-2xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          <User size={12} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-purple-700 font-black uppercase tracking-wider leading-none">
                            Employee / Telecaller
                          </p>
                          <p className="font-black text-[#162335] text-xs truncate mt-0.5" title={emp.name}>
                            {emp.name}
                            {emp.code ? (
                              <span className="text-[10px] font-mono text-slate-500 font-normal ml-1">
                                ({emp.code})
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Follow-up Timing Card */}
                <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/70 text-xs">
                  <p className="text-[10px] text-amber-700 font-black uppercase tracking-wider">Scheduled Follow-up</p>
                  <p className="font-black text-[#162335] text-xs flex items-center gap-1.5 mt-1">
                    <Calendar size={13} className="text-amber-600" />
                    {formatFriendlyDate(lead.followUpDate)} {lead.followUpTime ? `at ${formatFriendlyTime(lead.followUpTime)}` : ""}
                  </p>
                </div>

                {/* Contact & Location Info */}
                <div className="text-xs space-y-1.5 text-slate-600 font-semibold bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="flex items-center gap-2">
                    <Phone size={13} className="text-[#162335]" /> 
                    <span className="font-mono">{lead.phone}</span>
                  </p>
                  {(lead.city || lead.state) && (
                    <p className="flex items-center gap-2 text-slate-500">
                      <MapPin size={13} className="text-[#162335]" /> 
                      {[lead.city, lead.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>

                {lead.remarks && (
                  <div className="text-[11px] bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200 text-slate-600 italic">
                    <span className="font-bold not-italic text-slate-400">Note: </span>
                    {lead.remarks}
                  </div>
                )}
              </div>

              {/* Action Buttons to update Follow Up */}
              <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setViewingLead(lead)}
                  className="p-2 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                  title="View Full Lead Details"
                >
                  <Eye size={15} />
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openConvertModal(lead)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5"
                    title="Client is interested - Complete loan details and schedule meeting"
                  >
                    <ThumbsUp size={13} /> Interested
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNotInterestedLead(lead);
                      setNotInterestedRemarks("");
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black transition flex items-center gap-1.5"
                    title="Client declined - Mark as Not Interested"
                  >
                    <ThumbsDown size={13} /> Not Interested
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MODAL: CONVERT TO INTERESTED (COMPLETE DETAILS & SCHEDULE MEETING)     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {convertingLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 bg-[#162335] text-white flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-400 text-[#162335] rounded-md font-mono text-[10px] font-black uppercase">
                      {convertingLead.leadId}
                    </span>
                    <h3 className="text-base font-black tracking-wide">
                      Convert Follow-up Lead to Interested
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-1">
                    Fill in mandatory financial/loan details and schedule a consultation meeting with Sales.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConvertingLead(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form 
                onSubmit={handleSubmitConvert(onConvertLeadSubmit)} 
                className="overflow-y-auto p-6 space-y-6 custom-scrollbar flex-1"
              >
                {/* Client Overview Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Company</span>
                    <p className="font-black text-slate-800 mt-0.5">{convertingLead.companyName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Person</span>
                    <p className="font-bold text-slate-800 mt-0.5">{convertingLead.contactPerson}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-purple-700 uppercase">Employee</span>
                    <p className="font-bold text-[#162335] mt-0.5 truncate">
                      {getLeadEmployee(convertingLead).name}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
                    <p className="font-mono font-bold text-slate-800 mt-0.5">{convertingLead.phone}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Location</span>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {[convertingLead.city, convertingLead.state].filter(Boolean).join(", ") || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Section 1: Financial & Loan Assessment */}
                <div>
                  <h4 className="text-xs font-black text-[#162335] uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <DollarSign size={14} className="text-emerald-600" />
                    1. Financial Assessment & Loan Details (Mandatory)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Company Turnover */}
                    <div>
                      <label className={labelClass}>Company Turnover <span className="text-slate-400 font-normal text-[10px]">(Optional)</span></label>
                      <div className={`flex items-stretch rounded-xl border overflow-hidden ${
                        errorsConvert.turnoverAmount ? "border-rose-400 bg-rose-50/40" : "border-slate-200 bg-slate-50"
                      }`}>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="e.g. 5"
                          {...registerConvert("turnoverAmount", {
                            required: false,
                            validate: (val) => !val || parseFloat(val) > 0 || "Turnover must be > 0"
                          })}
                          className="w-full px-4 py-2.5 bg-transparent text-xs font-bold text-slate-800 outline-none"
                        />
                        <select
                          {...registerConvert("turnoverUnit")}
                          className="px-3 bg-slate-100 border-l border-slate-200 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                        >
                          <option value="Cr">Cr</option>
                          <option value="Lakhs">Lakhs</option>
                          <option value="Rupees">₹ (Rupees)</option>
                        </select>
                      </div>
                      {turnoverCalculatedINR ? (
                        <p className="text-[11px] text-emerald-700 font-bold mt-1">
                          ≈ ₹{turnoverCalculatedINR.toLocaleString("en-IN")}
                        </p>
                      ) : null}
                      {errorsConvert.turnoverAmount && (
                        <p className="text-[10px] text-rose-500 font-bold mt-1">{errorsConvert.turnoverAmount.message}</p>
                      )}
                    </div>

                    {/* Loan Amount Required */}
                    <div>
                      <label className={labelClass}>Loan Amount Required *</label>
                      <div className={`flex items-stretch rounded-xl border overflow-hidden ${
                        errorsConvert.loanAmountInput ? "border-rose-400 bg-rose-50/40" : "border-slate-200 bg-slate-50"
                      }`}>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="e.g. 50"
                          {...registerConvert("loanAmountInput", {
                            required: "Loan Amount is required",
                            validate: (val) => (val && parseFloat(val) > 0) || "Loan Amount must be > 0"
                          })}
                          className="w-full px-4 py-2.5 bg-transparent text-xs font-bold text-slate-800 outline-none"
                        />
                        <select
                          {...registerConvert("loanAmountUnit")}
                          className="px-3 bg-slate-100 border-l border-slate-200 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                        >
                          <option value="Cr">Cr</option>
                          <option value="Lakhs">Lakhs</option>
                          <option value="Rupees">₹ (Rupees)</option>
                        </select>
                      </div>
                      {loanCalculatedINR ? (
                        <p className="text-[11px] text-emerald-700 font-bold mt-1">
                          ≈ ₹{loanCalculatedINR.toLocaleString("en-IN")}
                        </p>
                      ) : null}
                      {errorsConvert.loanAmountInput && (
                        <p className="text-[10px] text-rose-500 font-bold mt-1">{errorsConvert.loanAmountInput.message}</p>
                      )}
                    </div>

                    {/* Type of Loan */}
                    <div>
                      <label className={labelClass}>Type of Loan *</label>
                      <select
                        {...registerConvert("loanType", { required: "Loan Type is required" })}
                        className={`${inputClass} bg-white ${errorsConvert.loanType ? "border-rose-400" : ""}`}
                      >
                        <option value="">Select Loan Type</option>
                        <option value="Property Purchase Loan">Property Purchase Loan</option>
                        <option value="Business Loan">Business Loan</option>
                        <option value="Property Loan">Property Loan</option>
                        <option value="Balance Transfer">Balance Transfer</option>
                      </select>
                      {errorsConvert.loanType && (
                        <p className="text-[10px] text-rose-500 font-bold mt-1">{errorsConvert.loanType.message}</p>
                      )}
                    </div>


                  </div>
                </div>

                {/* Sub-fields for Property Purchase Loan */}
                {convertLoanType === "Property Purchase Loan" && (
                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <h5 className="text-xs font-black text-slate-700 uppercase">Property Purchase Loan Specifics</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Type of Category *</label>
                        <select
                          {...registerConvert("propertyPurchaseCategory", { required: "Category is required" })}
                          className={`${inputClass} bg-white`}
                        >
                          <option value="">Select Category</option>
                          <option value="Home">Home</option>
                          <option value="NA Plot">NA Plot</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Residential">Residential</option>
                          <option value="Industrial">Industrial</option>
                        </select>
                        {errorsConvert.propertyPurchaseCategory && (
                          <p className="text-[10px] text-rose-500 font-bold mt-1">{errorsConvert.propertyPurchaseCategory.message}</p>
                        )}
                      </div>
                      <div>
                        <label className={labelClass}>Property Location *</label>
                        <input
                          type="text"
                          placeholder="Enter location"
                          {...registerConvert("ppLocation", { required: "Location is required" })}
                          className={inputClass}
                        />
                        {errorsConvert.ppLocation && (
                          <p className="text-[10px] text-rose-500 font-bold mt-1">{errorsConvert.ppLocation.message}</p>
                        )}
                      </div>
                      <div>
                        <label className={labelClass}>Market Rate (₹) *</label>
                        <input
                          type="number"
                          placeholder="Enter market rate"
                          {...registerConvert("ppMarketRate", { required: "Market rate is required" })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Document List (Dastavej) Rate (₹) *</label>
                        <input
                          type="number"
                          placeholder="Enter dastavej rate"
                          {...registerConvert("ppDastavejRate", { required: "Dastavej rate is required" })}
                          className={inputClass}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Ownership Name *</label>
                        <input
                          type="text"
                          placeholder="Enter ownership name"
                          {...registerConvert("ppDastavejName", { required: "Ownership Name is required" })}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-fields for Business Loan */}
                {convertLoanType === "Business Loan" && (
                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <h5 className="text-xs font-black text-slate-700 uppercase">Business Loan Specifics</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Business Loan Type *</label>
                        <select
                          {...registerConvert("businessLoanType", { required: "Business Loan Type is required" })}
                          className={`${inputClass} bg-white`}
                        >
                          <option value="">Select Category</option>
                          <option value="CGTMS">CGTMS</option>
                          <option value="MSME">MSME</option>
                          <option value="Unsecured">Unsecured</option>
                        </select>
                        {errorsConvert.businessLoanType && (
                          <p className="text-[10px] text-rose-500 font-bold mt-1">{errorsConvert.businessLoanType.message}</p>
                        )}
                      </div>

                      {convertBusinessLoanType === "Unsecured" && (
                        <>
                          <div>
                            <label className={labelClass}>Company Starting Year</label>
                            <input
                              type="text"
                              placeholder="e.g. 2018"
                              {...registerConvert("businessStartingYear")}
                              className={inputClass}
                            />
                            {errorsConvert.businessStartingYear && (
                              <p className="text-[10px] text-rose-500 font-bold mt-1">{errorsConvert.businessStartingYear.message}</p>
                            )}
                          </div>
                          <div className="sm:col-span-2">
                            <label className={labelClass}>Type of Work *</label>
                            <input
                              type="text"
                              placeholder="e.g. Manufacturing / Wholesale Trading"
                              {...registerConvert("businessTypeOfWork", { required: "Type of Work is required" })}
                              className={inputClass}
                            />
                            {errorsConvert.businessTypeOfWork && (
                              <p className="text-[10px] text-rose-500 font-bold mt-1">{errorsConvert.businessTypeOfWork.message}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-fields for Property Loan */}
                {convertLoanType === "Property Loan" && (
                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <h5 className="text-xs font-black text-slate-700 uppercase">Property Loan Specifics</h5>
                    <div>
                      <label className={labelClass}>Property Loan Category *</label>
                      <select
                        {...registerConvert("propertyLoanCategory", { required: "Property Loan Category is required" })}
                        className={`${inputClass} bg-white`}
                      >
                        <option value="">Select Category</option>
                        <option value="Working Capital">Working Capital</option>
                        <option value="LAP">LAP (Loan Against Property)</option>
                        <option value="Unsold">Unsold</option>
                        <option value="LRD">LRD (Lease Rental Discounting)</option>
                        <option value="NA Plot">NA Plot</option>
                      </select>
                      {errorsConvert.propertyLoanCategory && (
                        <p className="text-[10px] text-rose-500 font-bold mt-1">{errorsConvert.propertyLoanCategory.message}</p>
                      )}
                    </div>

                    {/* Working Capital */}
                    {convertPropertyLoanCategory === "Working Capital" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Property Location *</label>
                          <input type="text" placeholder="Location" {...registerConvert("propertyLocation", { required: "Location is required" })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Duration of Rent Property *</label>
                          <input type="text" placeholder="e.g. 5 Years" {...registerConvert("durationOfRentProperty", { required: "Duration is required" })} className={inputClass} />
                        </div>
                      </div>
                    )}

                    {/* LAP */}
                    {convertPropertyLoanCategory === "LAP" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Property Type *</label>
                          <select {...registerConvert("lapPropertyType", { required: "Property Type is required" })} className={`${inputClass} bg-white`}>
                            <option value="">Select Property Type</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Residential">Residential</option>
                            <option value="Industrial">Industrial</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Property Location *</label>
                          <input type="text" placeholder="Location" {...registerConvert("lapPropertyLocation", { required: "Location is required" })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Property Market Value (₹) *</label>
                          <input type="number" placeholder="Market Value" {...registerConvert("lapPropertyMarketValue", { required: "Market value is required" })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Work *</label>
                          <input type="text" placeholder="Work" {...registerConvert("lapPropertyWork", { required: "Work is required" })} className={inputClass} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Document List *</label>
                          <input type="text" placeholder="Document List" {...registerConvert("lapPropertyDocumentList", { required: "Document List is required" })} className={inputClass} />
                        </div>
                      </div>
                    )}

                    {/* Unsold */}
                    {convertPropertyLoanCategory === "Unsold" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Unit *</label>
                          <input type="text" placeholder="Unit" {...registerConvert("unsoldUnit", { required: "Unit is required" })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Property Market Value (₹) *</label>
                          <input type="number" placeholder="Market Value" {...registerConvert("unsoldMV", { required: "Market value is required" })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Scheme Name *</label>
                          <input type="text" placeholder="Scheme Name" {...registerConvert("unsoldScheme", { required: "Scheme is required" })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Location *</label>
                          <input type="text" placeholder="Location" {...registerConvert("unsoldLocation", { required: "Location is required" })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Floor *</label>
                          <input type="text" placeholder="Floor" {...registerConvert("unsoldFloor", { required: "Floor is required" })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Document List *</label>
                          <input type="text" placeholder="Dastavej" {...registerConvert("unsoldDastavej", { required: "Dastavej is required" })} className={inputClass} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Partnership *</label>
                          <input type="text" placeholder="Partnership details" {...registerConvert("unsoldPartnership", { required: "Partnership is required" })} className={inputClass} />
                        </div>
                      </div>
                    )}

                    {/* LRD */}
                    {convertPropertyLoanCategory === "LRD" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Rent (₹) *</label>
                          <input type="number" placeholder="Rent" {...registerConvert("lrdRent", { required: "Rent is required" })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Market Value (₹) *</label>
                          <input type="number" placeholder="Market Value" {...registerConvert("lrdMarketValue", { required: "Market value is required" })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Location *</label>
                          <input type="text" placeholder="Location" {...registerConvert("lrdLocation", { required: "Location is required" })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>LOI Year *</label>
                          <input type="text" placeholder="LOI Year" {...registerConvert("lrdLoiYear", { required: "LOI Year is required" })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Scheme Name *</label>
                          <input type="text" placeholder="Scheme Name" {...registerConvert("lrdSchemeName", { required: "Scheme is required" })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Document List *</label>
                          <input type="text" placeholder="Dastavej" {...registerConvert("lrdDastavej", { required: "Dastavej is required" })} className={inputClass} />
                        </div>
                      </div>
                    )}

                    {/* NA Plot */}
                    {convertPropertyLoanCategory === "NA Plot" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Location *</label>
                          <input type="text" placeholder="Location" {...registerConvert("naPlotLocation", { required: "Location is required" })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Property Market Value (₹) *</label>
                          <input type="number" placeholder="Market Value" {...registerConvert("naPlotMV", { required: "Market value is required" })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Document List *</label>
                          <input type="text" placeholder="Dastavej" {...registerConvert("naPlotDastavej", { required: "Dastavej is required" })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>VAR *</label>
                          <input type="text" placeholder="VAR" {...registerConvert("naPlotVAR", { required: "VAR is required" })} className={inputClass} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Scheme Name *</label>
                          <input type="text" placeholder="Scheme Name" {...registerConvert("naPlotScheme", { required: "Scheme is required" })} className={inputClass} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-fields for Balance Transfer */}
                {convertLoanType === "Balance Transfer" && (
                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <h5 className="text-xs font-black text-slate-700 uppercase">Balance Transfer Specifics</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Bank Name *</label>
                        <input type="text" placeholder="Existing Bank Name" {...registerConvert("btBankName", { required: "Bank Name is required" })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Rate of Interest (%) *</label>
                        <input type="number" step="0.01" placeholder="e.g. 8.5" {...registerConvert("btRateOfInterest", { required: "Rate of Interest is required" })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Property Type *</label>
                        <input type="text" placeholder="e.g. Commercial / Residential" {...registerConvert("btPropertyType", { required: "Property Type is required" })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Market Value (₹) *</label>
                        <input type="number" placeholder="Market value" {...registerConvert("btMarketValue", { required: "Market value is required" })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Location *</label>
                        <input type="text" placeholder="Location" {...registerConvert("btLocation", { required: "Location is required" })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Duration *</label>
                        <input type="text" placeholder="e.g. 15 Years" {...registerConvert("btDuration", { required: "Duration is required" })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Outstanding Amount (₹) *</label>
                        <input type="number" placeholder="Outstanding" {...registerConvert("btOutstanding", { required: "Outstanding is required" })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Foreclosure Charge (₹) *</label>
                        <input type="number" placeholder="Foreclosure Charge" {...registerConvert("btForeclosureCharge", { required: "Foreclosure Charge is required" })} className={inputClass} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 2: Meeting Schedule & Address */}
                <div>
                  <h4 className="text-xs font-black text-[#162335] uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Calendar size={14} className="text-blue-600" />
                    2. Meeting Schedule & Location (Creates Sales Meeting)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Meeting Date *</label>
                      <input
                        type="date"
                        min={todayStr}
                        {...registerConvert("meetingDate", { required: "Meeting Date is required" })}
                        className={`${inputClass} bg-white ${errorsConvert.meetingDate ? "border-rose-400" : ""}`}
                      />
                      {errorsConvert.meetingDate && (
                        <p className="text-[10px] text-rose-500 font-bold mt-1">{errorsConvert.meetingDate.message}</p>
                      )}
                    </div>

                    <div>
                      <label className={labelClass}>Meeting Time *</label>
                      <input
                        type="time"
                        {...registerConvert("meetingTime", { required: "Meeting Time is required" })}
                        className={`${inputClass} bg-white ${errorsConvert.meetingTime ? "border-rose-400" : ""}`}
                      />
                      {errorsConvert.meetingTime && (
                        <p className="text-[10px] text-rose-500 font-bold mt-1">{errorsConvert.meetingTime.message}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelClass}>Client Meeting Address / Location *</label>
                      <textarea
                        rows="2"
                        placeholder="Enter full meeting address or client office location..."
                        {...registerConvert("address", { required: "Meeting Address is required" })}
                        className={`${inputClass} bg-white ${errorsConvert.address ? "border-rose-400" : ""}`}
                      />
                      {errorsConvert.address && (
                        <p className="text-[10px] text-rose-500 font-bold mt-1">{errorsConvert.address.message}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelClass}>Consultation Remarks / Notes</label>
                      <textarea
                        rows="2"
                        placeholder="Add any specific client requirements, loan purpose, or notes for the Sales representative..."
                        {...registerConvert("remarks")}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setConvertingLead(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingConvert}
                    className="px-6 py-2.5 bg-[#162335] hover:bg-[#162335]/90 text-white font-black rounded-xl text-xs transition flex items-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {submittingConvert ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Converting & Scheduling...
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        Convert & Schedule Meeting
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. MODAL: NOT INTERESTED CONFIRMATION                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {notInterestedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                  <ThumbsDown size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#162335]">Mark as Not Interested</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Are you sure <span className="font-bold text-slate-700">{notInterestedLead.companyName}</span> ({notInterestedLead.contactPerson}) is not interested in proceeding?
                  </p>
                </div>

                <div className="text-left">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Reason / Notes</label>
                  <textarea
                    rows="3"
                    value={notInterestedRemarks}
                    onChange={(e) => setNotInterestedRemarks(e.target.value)}
                    placeholder="Enter reason for declining (e.g. Rate of interest too high, loan not required, etc.)..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-rose-400 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setNotInterestedLead(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingNotInterested}
                  onClick={onNotInterestedSubmit}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-white font-bold transition text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingNotInterested ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Confirm Not Interested
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3. MODAL: VIEW LEAD DETAILS                                              */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {viewingLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black bg-[#162335] text-white px-2 py-0.5 rounded-lg">
                    {viewingLead.leadId}
                  </span>
                  <h3 className="text-sm font-black text-[#162335]">Lead Details</h3>
                </div>
                <button onClick={() => setViewingLead(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-xs custom-scrollbar">
                {/* Employee / Telecaller Info Box */}
                {(() => {
                  const emp = getLeadEmployee(viewingLead);
                  return (
                    <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                          <User size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-purple-700 uppercase tracking-wider">Employee / Telecaller</p>
                          <p className="text-xs font-black text-[#162335] truncate mt-0.5">
                            {emp.name}
                          </p>
                          {emp.email && (
                            <p className="text-[10px] text-slate-500 font-medium truncate">{emp.email}</p>
                          )}
                        </div>
                      </div>
                      {emp.code && (
                        <span className="font-mono text-[11px] font-bold bg-white text-purple-700 border border-purple-200 px-2.5 py-1 rounded-xl shrink-0">
                          {emp.code}
                        </span>
                      )}
                    </div>
                  );
                })()}

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Company Information</p>
                  <p className="text-sm font-black text-slate-800">{viewingLead.companyName}</p>
                  <p className="text-slate-600 font-bold">Contact: {viewingLead.contactPerson}</p>
                  <p className="text-slate-600 font-mono">Phone: {viewingLead.phone}</p>
                  <p className="text-slate-600">Location: {[viewingLead.city, viewingLead.state].filter(Boolean).join(", ") || "N/A"}</p>
                </div>

                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-2">
                  <p className="text-[10px] font-black text-amber-700 uppercase flex items-center gap-1.5">
                    <Clock size={12} /> Scheduled Callback
                  </p>
                  <p className="text-sm font-black text-[#162335]">
                    {formatFriendlyDate(viewingLead.followUpDate)} at {formatFriendlyTime(viewingLead.followUpTime) || "N/A"}
                  </p>
                </div>

                {viewingLead.address && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Address</p>
                    <p className="text-slate-700 font-semibold">{viewingLead.address}</p>
                  </div>
                )}

                {viewingLead.remarks && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Employee Remarks</p>
                    <p className="text-slate-700 italic">{viewingLead.remarks}</p>
                  </div>
                )}

                {(viewingLead.meetingPersonNotes || viewingLead.meetingPersonName) && (
                  <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Manager Visit Remarks</p>
                      {viewingLead.meetingPersonName && (
                        <span className="text-[10px] font-bold text-emerald-700">Met by: {viewingLead.meetingPersonName}</span>
                      )}
                    </div>
                    <p className="text-slate-800 font-semibold whitespace-pre-wrap text-xs">{viewingLead.meetingPersonNotes}</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewingLead(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs"
                >
                  Close
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const l = viewingLead;
                      setViewingLead(null);
                      openConvertModal(l);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <ThumbsUp size={13} /> Interested
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const l = viewingLead;
                      setViewingLead(null);
                      setNotInterestedLead(l);
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <ThumbsDown size={13} /> Not Interested
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}