import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Phone, Loader2, AlertCircle, CheckCircle, MapPin, Plus, X, Filter, ClipboardList, Pencil, Trash2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import api from "../api";
import socket from "../utils/socket";
import FillFormModal from "./FillFormModal";

export default function MeetingsView() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isNewView = searchParams.get("type") === "new";

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  
  // Selected Meeting state for Fill Form
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const handleFillFormForCard = async (meeting) => {
    if (meeting.status !== "Scheduled" && meeting.status !== "Rescheduled") {
      showToast("Please select a scheduled or rescheduled meeting to fill the form.", "error");
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.get(`/meetings/${meeting._id}`);
      const m = res.data?.data || res.data;
      setSelectedMeeting(m);
      setIsFormOpen(true);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        showToast("You do not have permission to view this meeting.", "error");
      } else {
        showToast("Failed to fetch meeting details.", "error");
      }
    } finally {
      setActionLoading(false);
    }
  };
  const [formData, setFormData] = useState({
    title: "",
    customerName: "",
    customerPhone: "",
    date: "",
    time: "",
    location: "",
    type: "Consultation",
    status: "Scheduled",
    notes: ""
  });

  // Filter states
  const [filterStatus, setFilterStatus] = useState(isNewView ? "Scheduled" : "All");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    if (searchParams.get("type") === "new") {
      setFilterStatus("Scheduled");
    } else if (searchParams.get("type") === "total") {
      setFilterStatus("All");
    }
  }, [location.search]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/meetings");
      if (res.data.success) {
        setMeetings(res.data.data);
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
    
    if (!socket.connected) {
      socket.connect();
    }
    
    const handleUpdate = () => {
      fetchMeetings();
    };
    
    socket.on("data-updated", handleUpdate);
    
    return () => {
      socket.off("data-updated", handleUpdate);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openModal = async (meeting) => {
    setActionLoading(true);
    try {
      const res = await api.get(`/meetings/${meeting._id}`);
      const m = res.data?.data || res.data;
      setEditingMeeting(m);
      setFormData({
        title: m.title || "",
        customerName: m.customerName || "",
        customerPhone: m.customerPhone || "",
        date: m.date ? m.date.split("T")[0] : "",
        time: m.time || "",
        location: m.location || "",
        type: m.type || "Consultation",
        status: m.status || "Scheduled",
        notes: m.notes || ""
      });
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        showToast("You do not have permission to view this meeting.", "error");
      } else {
        showToast("Failed to fetch meeting details.", "error");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async (meeting) => {
    setActionLoading(true);
    try {
      const res = await api.get(`/meetings/${meeting._id}`);
      const m = res.data?.data || res.data;
      setEditingMeeting(m);
      setFormData({
        title: m.title || "",
        customerName: m.customerName || "",
        customerPhone: m.customerPhone || "",
        date: m.date ? m.date.split("T")[0] : "",
        time: m.time || "",
        location: m.location || "",
        type: m.type || "Consultation",
        status: "Rescheduled",
        notes: m.notes || ""
      });
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        showToast("You do not have permission to view this meeting.", "error");
      } else {
        showToast("Failed to fetch meeting details.", "error");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMeeting(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingMeeting) {
        const updatedFields = {};
        Object.keys(formData).forEach(key => {
          let formVal = formData[key];
          let originalVal = editingMeeting[key];
          if (key === 'date' && originalVal) {
            originalVal = originalVal.split('T')[0];
          }
          if ((formVal || "") !== (originalVal || "")) {
            updatedFields[key] = formVal;
          }
        });
        
        if (Object.keys(updatedFields).length === 0) {
          showToast("No changes detected.");
          setActionLoading(false);
          closeModal();
          return;
        }

        const res = await api.put(`/meetings/${editingMeeting._id}`, updatedFields);
        if (res.data?.success !== false) {
          showToast("Meeting updated successfully!");
        }
      }
      closeModal();
      fetchMeetings();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to save meeting.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteMeeting = async (id) => {
    if (!window.confirm("Are you sure you want to delete this meeting?")) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/meetings/${id}`);
      if (res.data?.success !== false) {
        showToast("Meeting deleted successfully!");
        fetchMeetings();
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to delete meeting.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setActionLoading(true);
    try {
      const res = await api.put(`/meetings/${id}`, { status });
      if (res.data.success) {
        showToast(`Meeting marked as ${status}.`);
        fetchMeetings();
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to update status.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMeetings = meetings.filter((m) => {
    const mStatus = m.status ? m.status.toLowerCase() : "";
    const fStatus = filterStatus.toLowerCase();
    
    let matchStatus = filterStatus === "All" || mStatus === fStatus;
    
    let matchDate = true;
    if (filterDate) {
      if (!m.date) {
        matchDate = false;
      } else {
        const d = new Date(m.date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const localFormatted = `${year}-${month}-${day}`;
        matchDate = localFormatted === filterDate;
      }
    }
    return matchStatus && matchDate;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Scheduled": return "bg-blue-100 text-blue-800";
      case "Completed": return "bg-emerald-100 text-emerald-800";
      case "Cancelled": return "bg-rose-100 text-rose-800";
      case "Rescheduled": return "bg-amber-100 text-amber-800";
      default: return "bg-slate-100 text-slate-800";
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
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-purple-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0a2540] flex items-center gap-2">
            <Calendar className="text-purple-500" />
            Client Meetings
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage your schedule, consultations, and face-to-face loan reviews.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
          <Filter size={16} /> Filters:
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500/20"
        >
          <option value="All">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Rescheduled">Rescheduled</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500/20"
        />
        {(filterStatus !== "All" || filterDate !== "") && (
          <button
            onClick={() => { setFilterStatus("All"); setFilterDate(""); }}
            className="text-xs text-rose-500 font-bold hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#0a2540]" size={32} /></div>
      ) : filteredMeetings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-sm flex flex-col items-center gap-3">
          <Calendar size={32} className="text-slate-300" />
          No meetings found for the selected criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMeetings.map((meeting) => (
            <div 
              key={meeting._id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-300"
            >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="text-sm font-black text-[#0a2540] truncate max-w-[70%]">{meeting.title}</h3>
                      <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${getStatusBadge(meeting.status)}`}>
                        {meeting.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Client / Customer</p>
                      <p className="text-sm font-black text-[#0a2540]">{meeting.customerName || meeting.leadId?.contactPerson || meeting.leadId?.companyName || "N/A"}</p>
                    </div>

                    <div className="space-y-1 bg-slate-50 border border-slate-100 p-3 rounded-2xl shadow-sm text-xs">
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Schedule</p>
                      <p className="font-black text-[#0a2540] text-sm flex items-center gap-1.5 mt-0.5">
                        <Calendar size={14} className="text-purple-500" />
                        {meeting.date ? new Date(meeting.date).toLocaleDateString() : "N/A"} at {meeting.time || "N/A"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone</p>
                        <p className="font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
                          <Phone size={10} className="text-slate-400"/> {meeting.leadId?.phoneNumber || meeting.customerPhone || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Type</p>
                        <p className="font-bold text-[#0a2540] mt-0.5">{meeting.type}</p>
                      </div>
                    </div>

                    {meeting.leadId && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 mt-2 pt-2">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Company</p>
                          <p className="font-semibold text-slate-700 mt-0.5 truncate">{meeting.leadId.companyName || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loan / CIBIL</p>
                          <p className="font-semibold text-slate-700 mt-0.5 truncate">
                            {meeting.leadId.loanType || "N/A"} / {meeting.leadId.cibilScore || "N/A"}
                          </p>
                        </div>
                      </div>
                    )}

                    {(meeting.location || (meeting.leadId && meeting.leadId.city)) && (
                      <div className="text-xs text-slate-600 flex items-start gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100 mt-2">
                        <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
                        <span className="font-medium line-clamp-2">
                          {meeting.location || `${meeting.leadId?.city || ""}, ${meeting.leadId?.state || ""}`}
                        </span>
                      </div>
                    )}
                    
                    {meeting.notes && (
                      <div className="text-[11px] text-slate-500 mt-2 italic line-clamp-2 border-l-2 border-slate-200 pl-2">
                        "{meeting.notes}"
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3">
                      {(meeting.status === "Scheduled" || meeting.status === "Rescheduled") ? (
                        <button
                          onClick={() => handleFillFormForCard(meeting)}
                          className="px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs bg-[#0a2540] hover:bg-[#0a2540]/90 text-[#d4af37]"
                        >
                          <ClipboardList size={13} /> Fill Form
                        </button>
                      ) : meeting.status === "Completed" ? (
                        <div className="px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <CheckCircle size={13} /> Form Submitted
                        </div>
                      ) : (
                        <div className="px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs bg-slate-100 text-slate-400 border border-slate-200">
                          {meeting.status}
                        </div>
                      )}

                      <div className="flex gap-1.5">
                        {(meeting.status === "Scheduled" || meeting.status === "Rescheduled") && (
                           <>
                             <button
                               disabled={actionLoading}
                               onClick={() => openModal(meeting)}
                               className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition disabled:opacity-50"
                               title="Edit Meeting"
                             >
                               <Pencil size={14} />
                             </button>
                             <button
                               disabled={actionLoading}
                               onClick={() => handleReschedule(meeting)}
                               className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition disabled:opacity-50"
                               title="Reschedule Meeting"
                             >
                               <Calendar size={14} />
                             </button>
                             <button
                               disabled={actionLoading}
                               onClick={() => updateStatus(meeting._id, "Cancelled")}
                               className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition disabled:opacity-50"
                               title="Cancel Meeting"
                             >
                               <X size={14} />
                             </button>
                           </>
                        )}
                        <button
                          disabled={actionLoading}
                          onClick={() => deleteMeeting(meeting._id)}
                          className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition disabled:opacity-50"
                          title="Delete Meeting"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

      {/* Modal for Create/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="font-black text-[#0a2540] text-lg">
                  Edit Meeting
                </h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-rose-500 transition">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <form id="meetingForm" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Meeting Title *</label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g. Initial Consultation"
                      className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Customer Name *</label>
                      <input
                        type="text"
                        name="customerName"
                        required
                        value={formData.customerName}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                      <input
                        type="text"
                        name="customerPhone"
                        value={formData.customerPhone}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date *</label>
                      <input
                        type="date"
                        name="date"
                        required
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Time *</label>
                      <input
                        type="time"
                        name="time"
                        required
                        value={formData.time}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value="Consultation">Consultation</option>
                        <option value="Document Collection">Document Collection</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Closing">Closing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Rescheduled">Rescheduled</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Office, Coffee Shop, Client Address..."
                      className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
                    <textarea
                      name="notes"
                      rows="3"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any preparation notes or meeting agenda..."
                      className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                    ></textarea>
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="meetingForm"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl font-bold text-[#d4af37] bg-[#0a2540] hover:bg-[#0a2540]/90 transition text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  Update Meeting
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFormOpen && (
          <FillFormModal 
            isOpen={isFormOpen} 
            onClose={(wasSubmitted) => {
              setIsFormOpen(false);
              if (wasSubmitted) fetchMeetings();
            }} 
            selectedMeeting={selectedMeeting} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}