import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Search, PlusCircle, Filter, Trash2, Edit2, Loader2, 
  Calendar, CheckCircle, AlertCircle, X, ChevronDown, ChevronUp, ArrowLeft,
  ClipboardList
} from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { getUserRoleCategory } from "../utils/hierarchy";

export default function WorkUpdatesView() {
  const { user } = useAuth();
  const roleCategory = getUserRoleCategory(user);
  const isTeamLeader = roleCategory === "Team Leader";
  const isSuperAdmin = roleCategory === "Admin";

  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Search and filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal states
  const [editUpdate, setEditUpdate] = useState(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // React Hook Form for creation
  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors } 
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      status: "Completed"
    }
  });

  // React Hook Form for editing
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit }
  } = useForm();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch updates from Backend API
  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        sortBy,
        sortOrder,
        search,
        status: statusFilter,
        teamName: teamFilter,
        startDate,
        endDate
      });

      const res = await api.get(`/work-updates?${queryParams.toString()}`);
      if (res.data.success) {
        setUpdates(res.data.data);
        setTotalPages(res.data.pages);
        setTotalRecords(res.data.total);
      }
    } catch (error) {
      console.error("Error fetching work updates:", error);
      showToast("Failed to retrieve work updates.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [page, sortBy, sortOrder, statusFilter, teamFilter, startDate, endDate]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchUpdates();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  // Submit Work Update
  const onSubmitUpdate = async (data) => {
    setSubmitting(true);
    try {
      const res = await api.post("/work-updates", data);
      if (res.data.success) {
        showToast("Work update submitted successfully!", "success");
        reset({
          title: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
          status: "Completed"
        });
        fetchUpdates();
      }
    } catch (error) {
      console.error("Error submitting work update:", error);
      showToast(error.response?.data?.message || "Failed to submit work update.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (update) => {
    setEditUpdate(update);
    resetEdit({
      title: update.title,
      description: update.description,
      date: new Date(update.date).toISOString().split("T")[0],
      status: update.status
    });
  };

  // Update Work Update
  const onUpdateSubmit = async (data) => {
    if (!editUpdate) return;
    setSubmittingEdit(true);
    try {
      const res = await api.put(`/work-updates/${editUpdate._id}`, data);
      if (res.data.success) {
        showToast("Work update modified successfully!", "success");
        setEditUpdate(null);
        fetchUpdates();
      }
    } catch (error) {
      console.error("Error updating work update:", error);
      showToast(error.response?.data?.message || "Failed to update record.", "error");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Delete Work Update
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await api.delete(`/work-updates/${deleteConfirm}`);
      if (res.data.success) {
        showToast("Work update record deleted successfully!", "success");
        setDeleteConfirm(null);
        fetchUpdates();
      }
    } catch (error) {
      console.error("Error deleting work update:", error);
      showToast("Failed to delete record.", "error");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatLastUpdated = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
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

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 border-l-8 border-l-[#0a2540]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0a2540] flex items-center gap-2">
            <FileText className="text-[#d4af37]" /> Daily Work Updates
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mt-1">
            {isTeamLeader ? "Team Leads & Submissions" : "Submit & Log Work Reports"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Submit Form (only for updates submission) */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-black text-[#0a2540] border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
            <PlusCircle size={18} className="text-[#d4af37]" />
            New Daily Work Update
          </h3>

          <form onSubmit={handleSubmit(onSubmitUpdate)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Update Title *</label>
              <input 
                type="text" 
                placeholder="e.g. KYC Collection & Client Callbacks" 
                {...register("title", { required: "Title is required" })}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${errors.title ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`}
              />
              {errors.title && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Update Description *</label>
              <textarea 
                rows="4"
                placeholder="Detail the work carried out today..." 
                {...register("description", { required: "Description is required" })}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition resize-y min-h-[100px] ${errors.description ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`}
              />
              {errors.description && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Date *</label>
                <input 
                  type="date" 
                  {...register("date", { required: "Date is required" })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none bg-white transition ${errors.date ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`}
                />
                {errors.date && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.date.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Status *</label>
                <select 
                  {...register("status", { required: "Status is required" })}
                  className="w-full px-4 py-2.5 border border-slate-200 focus:border-[#0a2540] rounded-xl text-xs outline-none transition bg-white"
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-[#0a2540] hover:bg-[#123659] text-white font-extrabold py-3 rounded-xl shadow-md transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Submitting...
                </>
              ) : (
                "Submit Update"
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Excel Table Logs (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden space-y-4">
          <h3 className="text-base font-black text-[#0a2540] flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
            <ClipboardList size={18} className="text-[#0a2540]" />
            Work Update Logs
          </h3>

          {/* Interactive Search & Filters */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text"
                  placeholder="Search updates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-[#0a2540] rounded-xl text-xs outline-none bg-white transition"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-slate-200 focus:border-[#0a2540] rounded-xl text-xs outline-none bg-white transition"
              >
                <option value="">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
              </select>

              {/* Team Filter (Admin/TL/Manager see this) */}
              {(isSuperAdmin || isTeamLeader) && (
                <input 
                  type="text"
                  placeholder="Filter by Team Name..."
                  value={teamFilter}
                  onChange={(e) => { setTeamFilter(e.target.value); setPage(1); }}
                  className="w-full px-3.5 py-2 border border-slate-200 focus:border-[#0a2540] rounded-xl text-xs outline-none bg-white transition"
                />
              )}
            </div>

            {/* Date range filter */}
            <div className="flex flex-col sm:flex-row items-center gap-3 border-t border-slate-100 pt-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                <Calendar size={12} /> Date Range:
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-[#0a2540] w-full"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-[#0a2540] w-full"
                />
              </div>
              {(startDate || endDate || statusFilter || teamFilter || search) && (
                <button 
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setStatusFilter("");
                    setTeamFilter("");
                    setSearch("");
                    setPage(1);
                  }}
                  className="text-[10px] text-rose-500 hover:text-rose-600 font-bold uppercase transition ml-auto"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Excel-Style Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-[#0a2540]" size={32} />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Syncing Update Grid...</p>
            </div>
          ) : updates.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-xs bg-slate-50/50 rounded-2xl">No work updates logged yet.</div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto scrollbar-thin rounded-2xl border border-slate-150 shadow-xs">
                <table className="w-full text-left text-xs border-collapse min-w-[900px] bg-white">
                  <thead>
                    <tr className="bg-[#0a2540] text-[#d4af37] font-black uppercase whitespace-nowrap">
                      <th onClick={() => handleSort("employeeId")} className="py-3.5 px-4 cursor-pointer hover:bg-[#123659] transition select-none">
                        Employee ID {sortBy === "employeeId" && (sortOrder === "asc" ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                      </th>
                      <th onClick={() => handleSort("employeeName")} className="py-3.5 px-4 cursor-pointer hover:bg-[#123659] transition select-none">
                        Employee Name {sortBy === "employeeName" && (sortOrder === "asc" ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                      </th>
                      <th onClick={() => handleSort("teamName")} className="py-3.5 px-4 cursor-pointer hover:bg-[#123659] transition select-none">
                        Team Name {sortBy === "teamName" && (sortOrder === "asc" ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                      </th>
                      <th onClick={() => handleSort("title")} className="py-3.5 px-4 cursor-pointer hover:bg-[#123659] transition select-none">
                        Update Title {sortBy === "title" && (sortOrder === "asc" ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                      </th>
                      <th className="py-3.5 px-4 max-w-[200px]">Update Description</th>
                      <th onClick={() => handleSort("date")} className="py-3.5 px-4 cursor-pointer hover:bg-[#123659] transition select-none">
                        Date {sortBy === "date" && (sortOrder === "asc" ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                      </th>
                      <th onClick={() => handleSort("status")} className="py-3.5 px-4 cursor-pointer hover:bg-[#123659] transition select-none text-center">
                        Status {sortBy === "status" && (sortOrder === "asc" ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                      </th>
                      <th onClick={() => handleSort("updatedAt")} className="py-3.5 px-4 cursor-pointer hover:bg-[#123659] transition select-none">
                        Last Updated {sortBy === "updatedAt" && (sortOrder === "asc" ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                      </th>
                      <th className="py-3.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
                    {updates.map((up) => {
                      const isOwner = up.employeeDbId === user.id;
                      return (
                        <tr key={up._id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{up.employeeId}</td>
                          <td className="py-3.5 px-4 font-extrabold text-[#0a2540]">{up.employeeName}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">{up.teamName || "N/A"}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-700 max-w-[150px] truncate" title={up.title}>{up.title}</td>
                          <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-500 font-medium" title={up.description}>{up.description}</td>
                          <td className="py-3.5 px-4 text-slate-500">{formatDate(up.date)}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                              up.status === "Completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                              up.status === "In Progress" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                              "bg-rose-50 text-rose-700 border border-rose-100"
                            }`}>
                              {up.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px]">{formatLastUpdated(up.updatedAt)}</td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex justify-center gap-1.5">
                              {isOwner ? (
                                <>
                                  <button 
                                    onClick={() => openEditModal(up)}
                                    className="p-1.5 text-slate-400 hover:text-[#d4af37] hover:bg-slate-100 rounded-lg transition"
                                    title="Edit Work Update"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button 
                                    onClick={() => setDeleteConfirm(up._id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                                    title="Delete Work Update"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-300 italic select-none">No Access</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-150 pt-4 px-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase">
                    Showing updates { (page-1)*10 + 1 } - { Math.min(page*10, totalRecords) } of { totalRecords }
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
      </div>

      {/* Edit Update Modal */}
      {editUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditUpdate(null)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden z-50 text-left"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-md font-black text-[#0a2540] flex items-center gap-2">
                <Edit2 size={16} className="text-[#d4af37]" /> Edit Work Update
              </h3>
              <button 
                onClick={() => setEditUpdate(null)}
                className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit(onUpdateSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Update Title *</label>
                <input 
                  type="text" 
                  {...registerEdit("title", { required: "Title is required" })}
                  className={`w-full px-4 py-2 border rounded-xl text-xs outline-none focus:border-[#0a2540] ${errorsEdit.title ? "border-rose-455" : "border-slate-200"}`}
                />
                {errorsEdit.title && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errorsEdit.title.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Update Description *</label>
                <textarea 
                  rows="4"
                  {...registerEdit("description", { required: "Description is required" })}
                  className={`w-full px-4 py-2 border rounded-xl text-xs outline-none focus:border-[#0a2540] resize-y ${errorsEdit.description ? "border-rose-455" : "border-slate-200"}`}
                />
                {errorsEdit.description && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errorsEdit.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Date *</label>
                  <input 
                    type="date" 
                    {...registerEdit("date", { required: "Date is required" })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-[#0a2540]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Status *</label>
                  <select 
                    {...registerEdit("status", { required: "Status is required" })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-[#0a2540]"
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setEditUpdate(null)} 
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold transition text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingEdit} 
                  className="px-5 py-2 bg-[#0a2540] hover:bg-[#123659] text-white font-bold rounded-xl transition text-xs flex items-center gap-1.5"
                >
                  {submittingEdit ? <Loader2 size={14} className="animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirm(null)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden z-50"
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <h3 className="text-md font-black text-[#0a2540]">Delete Work Update</h3>
              <p className="text-xs text-slate-500">Are you sure you want to remove this report update? This action cannot be undone.</p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold transition text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-white font-bold transition text-xs"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
