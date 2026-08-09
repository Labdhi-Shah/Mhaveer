import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Phone, Loader2, Award, Clock, AlertCircle, CheckCircle,
  MapPin, Eye, FileText, Trash2, Upload, X, Check, ChevronDown
} from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { getMergedLeadsAndStats } from "../utils/hierarchy";

const REQUIRED_DOCUMENTS = [
  { id: "aadhaar", title: "Aadhaar Card" },
  { id: "pan", title: "PAN Card" },
  { id: "passportPhoto", title: "Passport Size Photo" },
  { id: "bankStatement", title: "Bank Statement (Last 3 Years / Quarterly Statements)" },
  { id: "electricityBill", title: "Latest Electricity Bill" },
  { id: "itr", title: "Income Tax Return (ITR)" },
  { id: "gstCertificate", title: "GST Certificate" },
  { id: "rationCard", title: "Ration Card" }
];

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

export default function MeetingsView() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Status State
  const [meetingStatuses, setMeetingStatuses] = useState(() => {
    const saved = localStorage.getItem("meeting_statuses");
    return saved ? JSON.parse(saved) : {};
  });

  // Selected Lead for view documents & address modal
  const [selectedLeadForDocs, setSelectedLeadForDocs] = useState(null);
  const [leadDocs, setLeadDocs] = useState({});

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const updateMeetingStatus = (leadId, newStatus) => {
    const updated = { ...meetingStatuses, [leadId]: newStatus };
    setMeetingStatuses(updated);
    localStorage.setItem("meeting_statuses", JSON.stringify(updated));
    showToast(`Meeting status updated to ${newStatus}.`, "success");
  };

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/leads?limit=100");
      if (res.data.success) {
        const ownLeads = res.data.data;
        const ownStats = { todaysCalls: 0, interestedLeads: 0, pendingFollowUps: 0, todaysMeetings: 0 };
        const { leads: mergedLeads } = await getMergedLeadsAndStats(user, ownLeads, ownStats);

        // Filter leads that have meeting date specified
        const meetingLeads = mergedLeads.filter((lead) => lead.meetingDate);
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

  // Sync documents whenever a lead is selected
  useEffect(() => {
    if (selectedLeadForDocs) {
      const saved = localStorage.getItem(`lead_docs_${selectedLeadForDocs._id}`);
      if (saved) {
        setLeadDocs(JSON.parse(saved));
      } else {
        // Seed default documents
        const defaultDocs = {
          aadhaar: { name: "Aadhaar_Card_Verified.pdf", size: "1.2 MB", uploadedAt: new Date().toLocaleDateString() },
          pan: { name: "PAN_Card_Verified.pdf", size: "850 KB", uploadedAt: new Date().toLocaleDateString() },
        };
        localStorage.setItem(`lead_docs_${selectedLeadForDocs._id}`, JSON.stringify(defaultDocs));
        setLeadDocs(defaultDocs);
      }
    }
  }, [selectedLeadForDocs]);

  const handleDocUpload = (docId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const newDocs = {
      ...leadDocs,
      [docId]: {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedAt: new Date().toLocaleDateString()
      }
    };

    setLeadDocs(newDocs);
    localStorage.setItem(`lead_docs_${selectedLeadForDocs._id}`, JSON.stringify(newDocs));
    showToast(`${REQUIRED_DOCUMENTS.find(d => d.id === docId).title} uploaded successfully!`, "success");
  };

  const handleDocDelete = (docId) => {
    const newDocs = { ...leadDocs };
    delete newDocs[docId];

    setLeadDocs(newDocs);
    localStorage.setItem(`lead_docs_${selectedLeadForDocs._id}`, JSON.stringify(newDocs));
    showToast(`${REQUIRED_DOCUMENTS.find(d => d.id === docId).title} removed.`, "success");
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
          {leads.map((lead) => {
            const currentStatus = meetingStatuses[lead._id] || "Pending";
            return (
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
                      {formatFriendlyDate(lead.meetingDate)} at {formatFriendlyTime(lead.meetingTime) || "N/A"}
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
                <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedLeadForDocs(lead)}
                    className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition flex items-center gap-1.5"
                  >
                    <Eye size={14} />
                    View
                  </button>

                  <div className="flex items-center gap-2">
                    <select
                      disabled={currentStatus === "Completed"}
                      value={currentStatus}
                      onChange={(e) => updateMeetingStatus(lead._id, e.target.value)}
                      className={`px-3 py-1.5 border rounded-xl text-xs font-bold outline-none transition cursor-pointer ${
                        currentStatus === "Pending" ? "bg-amber-50 border-amber-200 text-amber-800" :
                        currentStatus === "Cancel" ? "bg-rose-50 border-rose-200 text-rose-800" :
                        currentStatus === "Confirm" ? "bg-blue-50 border-blue-200 text-blue-800" :
                        "bg-emerald-50 border-emerald-200 text-emerald-800"
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Cancel">Cancel</option>
                      <option value="Confirm">Confirm</option>
                      {currentStatus === "Completed" && <option value="Completed">Completed</option>}
                    </select>

                    {currentStatus === "Confirm" && (
                      <button
                        onClick={() => {
                          updateMeetingStatus(lead._id, "Completed");
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm shrink-0"
                      >
                        <Check size={12} />
                        Submit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Documents & Address Modal */}
      <AnimatePresence>
        {selectedLeadForDocs && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLeadForDocs(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              className="bg-white rounded-[24px] shadow-2xl max-w-[850px] w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden z-50 text-left"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#0a2540]">
                      Documents & Details
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Lead ID: {selectedLeadForDocs.leadId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLeadForDocs(null)}
                  className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Left Column (2 cols): Address & Details */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-3">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-2">
                        <MapPin size={14} className="text-purple-500" /> Lead Address
                      </h4>
                      <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 min-h-[90px] text-xs leading-relaxed text-slate-600 whitespace-pre-wrap font-medium">
                        {selectedLeadForDocs.address || selectedLeadForDocs.remarks || (
                          <span className="text-slate-400 italic">No Address Specified</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-3">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-2">
                        Contact Info
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company</span>
                          <p className="font-extrabold text-[#0a2540]">{selectedLeadForDocs.companyName}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Person</span>
                          <p className="font-bold text-slate-700">{selectedLeadForDocs.contactPerson}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</span>
                          <p className="font-bold text-slate-700">{selectedLeadForDocs.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (3 cols): Document Uploads list */}
                  <div className="md:col-span-3 space-y-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-3">
                        <FileText size={14} className="text-[#0a2540]" /> Uploaded Documents
                      </h4>

                      <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
                        {REQUIRED_DOCUMENTS.map((doc) => {
                          const file = leadDocs[doc.id];
                          return (
                            <div key={doc.id} className="py-3 flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#0a2540] truncate">{doc.title}</p>
                                {file ? (
                                  <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                                    📄 {file.name} • {file.size}
                                  </p>
                                ) : (
                                  <p className="text-[10px] text-slate-400 italic mt-0.5">Pending upload</p>
                                )}
                              </div>

                              <div className="shrink-0 flex items-center gap-2">
                                {file ? (
                                  <>
                                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-black rounded-lg uppercase">
                                      Uploaded
                                    </span>
                                    <button
                                      onClick={() => handleDocDelete(doc.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                      title="Delete document"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-400 text-[9px] font-bold rounded-lg uppercase">
                                      Missing
                                    </span>
                                    <label className="p-1 text-[#0a2540] hover:text-[#d4af37] hover:bg-slate-50 rounded-lg cursor-pointer transition flex items-center justify-center">
                                      <Upload size={14} />
                                      <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => handleDocUpload(doc.id, e)}
                                      />
                                    </label>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-end z-10 shrink-0">
                <button
                  onClick={() => setSelectedLeadForDocs(null)}
                  className="px-4 py-2 bg-[#0a2540] text-[#d4af37] text-xs font-bold rounded-xl hover:bg-slate-800 transition"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
