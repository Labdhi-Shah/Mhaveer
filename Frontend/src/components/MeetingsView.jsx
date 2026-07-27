import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Phone, Loader2, Award, Clock, AlertCircle, CheckCircle, MapPin, Eye } from "lucide-react";
import api from "../api";

export default function MeetingsView() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/leads");
      if (res.data.success) {
        // Filter leads that have meeting date specified
        const meetingLeads = res.data.data.filter((lead) => lead.meetingDate);
        setLeads(meetingLeads);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch meetings.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const clearMeeting = async (leadId) => {
    setUpdatingId(leadId);
    try {
      const leadToUpdate = leads.find((l) => l._id === leadId);
      const res = await api.put(`/leads/${leadId}`, {
        ...leadToUpdate,
        meetingDate: "",
        meetingTime: ""
      });
      if (res.data.success) {
        showToast("Meeting cleared successfully!", "success");
        fetchMeetings();
      }
    } catch (err) {
      showToast("Failed to clear meeting.", "error");
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
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-purple-500">
        <h1 className="text-xl sm:text-2xl font-black text-[#0a2540] flex items-center gap-2">
          <Calendar className="text-purple-500" />
          Scheduled Client Meetings
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Review upcoming client consultations and face-to-face loan reviews.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#0a2540]" size={32} /></div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-sm">
          No upcoming client meetings scheduled at this time.
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
                  <span className="text-[10px] font-extrabold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-100 uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={12} /> Consultation
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-black text-[#0a2540]">{lead.companyName}</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">{lead.contactPerson}</p>
                </div>

                <div className="space-y-1 bg-[#0a2540] text-[#d4af37] p-3 rounded-2xl shadow-sm text-xs">
                  <p className="text-[10px] text-slate-300 font-extrabold uppercase">Meeting Time</p>
                  <p className="font-black text-sm flex items-center gap-1.5 mt-0.5">
                    <Calendar size={14} className="text-[#d4af37]" />
                    {lead.meetingDate} at {lead.meetingTime || "N/A"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{lead.phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Loan Type</p>
                    <p className="font-bold text-[#0a2540] mt-0.5">{lead.loanType}</p>
                  </div>
                </div>

                {lead.city && (
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" />
                    <span>Location: {lead.city}, {lead.state || ""}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons to update/clear meeting */}
              <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-end">
                <button
                  disabled={updatingId === lead._id}
                  onClick={() => clearMeeting(lead._id)}
                  className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition flex items-center gap-1.5"
                >
                  Clear Meeting
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
