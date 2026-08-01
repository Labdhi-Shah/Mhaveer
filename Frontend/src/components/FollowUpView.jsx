import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Phone, Loader2, Award, Calendar, AlertCircle, CheckCircle, HelpCircle, Eye } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { getMergedLeadsAndStats } from "../utils/hierarchy";

export default function FollowUpView() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchFollowups = async () => {
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

        const followUpLeads = mergedLeads.filter(lead => lead.interested === "Call Back Later");
        setLeads(followUpLeads);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch follow-ups.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, []);

  const updateInterest = async (leadId, newStatus) => {
    setUpdatingId(leadId);
    try {
      const leadToUpdate = leads.find((l) => l._id === leadId);
      const res = await api.put(`/leads/${leadId}`, {
        ...leadToUpdate,
        interested: newStatus
      });
      if (res.data.success) {
        showToast(`Lead updated successfully to '${newStatus}'!`, "success");
        fetchFollowups();
      }
    } catch (err) {
      showToast("Failed to update status.", "error");
    } finally {
      setUpdatingId(null);
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
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-[#d4af37]">
        <h1 className="text-xl sm:text-2xl font-black text-[#0a2540] flex items-center gap-2">
          <Clock className="text-[#d4af37]" />
          Pending CRM Follow-ups
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Review and callback leads who requested call back later.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#0a2540]" size={32} /></div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-sm">
          No pending follow-ups scheduled at this moment. Excellent work!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map((lead) => (
            <div key={lead._id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-300">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-mono text-[10px] font-black text-[#0a2540] bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl">
                    {lead.leadId}
                  </span>
                  <span className="text-[10px] font-extrabold text-[#d4af37] bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-100 uppercase tracking-wider flex items-center gap-1">
                    <Clock size={12} /> Call Back
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-black text-[#0a2540]">{lead.companyName}</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">{lead.contactPerson}</p>
                </div>

                <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase">Follow-up Time</p>
                  <p className="font-black text-[#0a2540] text-sm flex items-center gap-1.5 mt-0.5">
                    <Calendar size={14} className="text-[#d4af37]" />
                    {lead.followUpDate} at {lead.followUpTime || "N/A"}
                  </p>
                </div>

                <div className="text-xs space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</p>
                  <p className="font-bold text-slate-700 flex items-center gap-1.5"><Phone size={13} /> {lead.phone}</p>
                </div>

                {lead.address && (
                  <div className="text-xs bg-slate-50/50 p-2.5 rounded-xl border border-dashed border-slate-200 text-slate-600 italic">
                    Address: {lead.address}
                  </div>
                )}
              </div>

              {/* Action Buttons to update Follow Up */}
              <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Update Status:</span>
                <div className="flex gap-2">
                  <button
                    disabled={updatingId === lead._id}
                    onClick={() => updateInterest(lead._id, "Yes")}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl text-xs font-black text-emerald-800 transition"
                  >
                    Interested
                  </button>
                  <button
                    disabled={updatingId === lead._id}
                    onClick={() => updateInterest(lead._id, "No")}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl text-xs font-black text-rose-800 transition"
                  >
                    Not Interested
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
