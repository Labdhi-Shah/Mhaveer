import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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

  // React Hook Form for New Lead
  const { 
    register, 
    handleSubmit, 
    watch, 
    reset, 
    formState: { errors } 
  } = useForm({
    defaultValues: {
      companyName: "",
      contactPerson: "",
      phone: "",
      city: "",
      state: "",
      yearlyIncome: "",
      loanAmount: "",
      loanType: "",
      cibilScore: "",
      interested: "",
      callStatus: "",
      meetingDate: "",
      meetingTime: "",
      remarks: "",
      followUpDate: "",
      followUpTime: ""
    }
  });

  const interestedValue = watch("interested");

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

  // Form Submit Handler
  const onSubmitLead = async (data) => {
    setLoading(true);
    try {
      // Validate meeting date not in past
      if (data.meetingDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const meetD = new Date(data.meetingDate);
        if (meetD < today) {
          showToast("Meeting date cannot be in the past.", "error");
          setLoading(false);
          return;
        }
      }

      // Format payload (convert strings to numbers where appropriate)
      const payload = {
        ...data,
        yearlyIncome: parseFloat(data.yearlyIncome),
        loanAmount: parseFloat(data.loanAmount),
        cibilScore: parseInt(data.cibilScore)
      };

      const res = await api.post("/leads", payload);

      if (res.data.success) {
        showToast("Lead saved successfully!", "success");
        reset(); // Automatically clear form
        fetchData(); // Reload stats and recent leads
      }
    } catch (error) {
      console.error("Error saving lead:", error);
      showToast(error.response?.data?.message || "Failed to save lead.", "error");
    } finally {
      setLoading(false);
    }
  };

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
          { title: "Today's Calls", value: stats.todayCalls, color: "border-t-[#0a2540]", iconBg: "bg-blue-50 text-[#0a2540]", icon: <Phone size={22} /> },
          { title: "Interested Leads", value: stats.interestedLeads, color: "border-t-emerald-500", iconBg: "bg-emerald-50 text-emerald-600", icon: <Award size={22} /> },
          { title: "Pending Follow-ups", value: stats.pendingFollowups, color: "border-t-[#d4af37]", iconBg: "bg-amber-50 text-[#d4af37]", icon: <Clock size={22} /> },
          { title: "Today's Meetings", value: stats.todayMeetings, color: "border-t-purple-500", iconBg: "bg-purple-50 text-purple-600", icon: <Calendar size={22} /> }
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

      {/* Main Grid: Form (Left/Center) & Recent Leads (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lead Form Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-[#0a2540] border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
              <Briefcase size={20} className="text-[#d4af37]" />
              New Loan Lead Entry
            </h3>

            <form onSubmit={handleSubmit(onSubmitLead)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Company Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Company Name *</label>
                  <input
                    type="text"
                    placeholder="Enter company name"
                    {...register("companyName", { required: "Company Name is required" })}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${
                      errors.companyName ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"
                    }`}
                  />
                  {errors.companyName && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.companyName.message}</p>}
                </div>

                {/* Contact Person Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Contact Person Name *</label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    {...register("contactPerson", { required: "Contact Person Name is required" })}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${
                      errors.contactPerson ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"
                    }`}
                  />
                  {errors.contactPerson && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.contactPerson.message}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    {...register("phone", { 
                      required: "Phone is required",
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message: "Indian mobile only (10 digits starting with 6-9)"
                      }
                    })}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${
                      errors.phone ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"
                    }`}
                  />
                  {errors.phone && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.phone.message}</p>}
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">City</label>
                  <input
                    type="text"
                    placeholder="Enter city"
                    {...register("city")}
                    className="w-full px-4 py-2.5 border border-slate-200 focus:border-[#0a2540] rounded-xl text-xs outline-none transition"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">State</label>
                  <input
                    type="text"
                    placeholder="Enter state"
                    {...register("state")}
                    className="w-full px-4 py-2.5 border border-slate-200 focus:border-[#0a2540] rounded-xl text-xs outline-none transition"
                  />
                </div>

                {/* Yearly Income */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Yearly Income (INR) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 600000"
                    {...register("yearlyIncome", { required: "Yearly Income is required", min: { value: 1, message: "Income must be greater than 0" } })}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${
                      errors.yearlyIncome ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"
                    }`}
                  />
                  {errors.yearlyIncome && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.yearlyIncome.message}</p>}
                </div>

                {/* Loan Amount Required */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Loan Amount Required *</label>
                  <input
                    type="number"
                    placeholder="e.g. 1500000"
                    {...register("loanAmount", { required: "Loan Amount is required", min: { value: 1, message: "Loan Amount must be greater than 0" } })}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${
                      errors.loanAmount ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"
                    }`}
                  />
                  {errors.loanAmount && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.loanAmount.message}</p>}
                </div>

                {/* Type of Loan */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Type of Loan *</label>
                  <select
                    {...register("loanType", { required: "Loan Type is required" })}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none bg-white transition ${
                      errors.loanType ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"
                    }`}
                  >
                    <option value="">Select Loan Type</option>
                    <option value="Personal Loan">Personal Loan</option>
                    <option value="Home Loan">Home Loan</option>
                    <option value="Business Loan">Business Loan</option>
                    <option value="Car Loan">Car Loan</option>
                    <option value="Gold Loan">Gold Loan</option>
                    <option value="Education Loan">Education Loan</option>
                  </select>
                  {errors.loanType && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.loanType.message}</p>}
                </div>

                {/* CIBIL Score */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">CIBIL Score *</label>
                  <input
                    type="number"
                    placeholder="300 - 900"
                    {...register("cibilScore", { 
                      required: "CIBIL Score is required",
                      min: { value: 300, message: "Min score is 300" },
                      max: { value: 900, message: "Max score is 900" }
                    })}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${
                      errors.cibilScore ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"
                    }`}
                  />
                  {errors.cibilScore && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.cibilScore.message}</p>}
                </div>

                {/* Interested */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Interested *</label>
                  <select
                    {...register("interested", { required: "Interested Status is required" })}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none bg-white transition ${
                      errors.interested ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"
                    }`}
                  >
                    <option value="">Select Option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Call Back Later">Call Back Later</option>
                  </select>
                  {errors.interested && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.interested.message}</p>}
                </div>

                {/* Call Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Call Status *</label>
                  <select
                    {...register("callStatus", { required: "Call Status is required" })}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none bg-white transition ${
                      errors.callStatus ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"
                    }`}
                  >
                    <option value="">Select Call Status</option>
                    <option value="Connected">Connected</option>
                    <option value="Not Picked">Not Picked</option>
                    <option value="Busy">Busy</option>
                    <option value="Wrong Number">Wrong Number</option>
                  </select>
                  {errors.callStatus && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.callStatus.message}</p>}
                </div>

                {/* Meeting Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Meeting Date</label>
                  <input
                    type="date"
                    {...register("meetingDate")}
                    className="w-full px-4 py-2.5 border border-slate-200 focus:border-[#0a2540] rounded-xl text-xs outline-none transition bg-white"
                  />
                </div>

                {/* Meeting Time */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Meeting Time</label>
                  <input
                    type="time"
                    {...register("meetingTime")}
                    className="w-full px-4 py-2.5 border border-slate-200 focus:border-[#0a2540] rounded-xl text-xs outline-none transition bg-white"
                  />
                </div>
              </div>

              {/* Conditional Follow-up Section (Visible only if Interested === 'Call Back Later') */}
              <AnimatePresence>
                {interestedValue === "Call Back Later" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden border border-amber-200 bg-amber-50/50 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div className="col-span-full">
                      <p className="text-xs font-bold text-[#d4af37] flex items-center gap-1.5">
                        <Clock size={14} /> Schedule Follow-up Details
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Follow-up Date *</label>
                      <input
                        type="date"
                        {...register("followUpDate", { required: "Follow-up Date is required" })}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none bg-white transition ${
                          errors.followUpDate ? "border-rose-400 focus:border-rose-500" : "border-amber-300 focus:border-[#0a2540]"
                        }`}
                      />
                      {errors.followUpDate && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.followUpDate.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Follow-up Time *</label>
                      <input
                        type="time"
                        {...register("followUpTime", { required: "Follow-up Time is required" })}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none bg-white transition ${
                          errors.followUpTime ? "border-rose-400 focus:border-rose-500" : "border-amber-300 focus:border-[#0a2540]"
                        }`}
                      />
                      {errors.followUpTime && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.followUpTime.message}</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Remarks / Call Notes</label>
                <textarea
                  rows="3"
                  placeholder="Enter custom comments, business discussion notes, client background..."
                  {...register("remarks")}
                  className="w-full px-4 py-2.5 border border-slate-200 focus:border-[#0a2540] rounded-xl text-xs outline-none transition"
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#0a2540] hover:bg-[#123659] disabled:bg-slate-300 text-white font-black py-3 px-6 rounded-xl shadow-md transition-all text-xs uppercase tracking-wider cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving Lead...
                  </>
                ) : (
                  <>
                    Save Lead
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Recent Leads Panel (Right Side) */}
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
