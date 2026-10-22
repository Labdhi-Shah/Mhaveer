import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Plus, Search, Filter, Trash2, Eye, Download, 
  ZoomIn, ZoomOut, RotateCw, X, Upload, CheckCircle2, 
  AlertCircle, Image as ImageIcon, Calendar, User, Maximize2
} from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { getUserRole } from "../utils/hierarchy";
import socket from "../utils/socket";

const CATEGORIES = [
  "All",
  "KYC & Identity",
  "Banking & Income",
  "Property Documents",
  "Checklists",
  "General"
];

const resolveImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  const rawBaseURL = import.meta.env.VITE_API_URL || "";
  const cleanBaseURL = rawBaseURL.endsWith("/") ? rawBaseURL.slice(0, -1) : rawBaseURL;
  return cleanBaseURL ? `${cleanBaseURL}${url}` : url;
};

export default function DocumentsView() {
  const { user } = useAuth();
  const role = getUserRole(user);
  const isManager = role === "Manager";

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [toast, setToast] = useState(null);

  // Manager Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("KYC & Identity");
  const [newDescription, setNewDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [useUrlMode, setUseUrlMode] = useState(false);
  const fileInputRef = useRef(null);

  // Lightbox / Image Viewer State
  const [previewDoc, setPreviewDoc] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch documents from backend or fallback to localStorage
  const fetchDocuments = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get("/documents");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setDocuments(res.data.data);
      } else {
        const localSaved = localStorage.getItem("company_documents_custom");
        setDocuments(localSaved ? JSON.parse(localSaved) : []);
      }
    } catch (err) {
      console.warn("Backend /documents fetch failed, loading local document gallery:", err.message);
      const localSaved = localStorage.getItem("company_documents_custom");
      if (localSaved) {
        try {
          setDocuments(JSON.parse(localSaved));
        } catch {
          setDocuments([]);
        }
      } else {
        setDocuments([]);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();

    if (!socket.connected) {
      socket.connect();
    }

    const handleUpdate = () => {
      fetchDocuments(false);
    };

    const handleDataUpdated = (payload) => {
      if (!payload || payload.entity === "document") {
        if (payload?.action === "delete" && payload.id) {
          setDocuments((prev) => prev.filter((d) => d._id !== payload.id && d.id !== payload.id));
        } else if (payload?.action === "create" && payload.data) {
          const newDoc = payload.data;
          setDocuments((prev) => [newDoc, ...prev.filter((d) => d._id !== newDoc._id && d.id !== newDoc.id)]);
        }
        fetchDocuments(false);
      }
    };

    socket.on("documents-updated", handleUpdate);
    socket.on("document:created", (doc) => handleDataUpdated({ entity: "document", action: "create", data: doc }));
    socket.on("document:deleted", (id) => handleDataUpdated({ entity: "document", action: "delete", id }));
    socket.on("data-updated", handleDataUpdated);

    return () => {
      socket.off("documents-updated", handleUpdate);
      socket.off("document:created");
      socket.off("document:deleted");
      socket.off("data-updated", handleDataUpdated);
    };
  }, []);

  // Handle file selection in upload modal
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file (PNG, JPG, JPEG, WEBP)", "error");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast("Image size must be less than 15MB", "error");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle Manager Upload Document Submission
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!isManager) {
      showToast("Only managers are allowed to add documents.", "error");
      return;
    }

    if (!newTitle.trim()) {
      showToast("Please enter a document title.", "error");
      return;
    }

    if (!useUrlMode && !imageFile && !imagePreview) {
      showToast("Please choose an image file to upload.", "error");
      return;
    }

    if (useUrlMode && !imageUrlInput.trim()) {
      showToast("Please enter an image URL.", "error");
      return;
    }

    setUploadLoading(true);
    try {
      let createdDoc = null;

      // Try uploading to backend API
      try {
        const formData = new FormData();
        formData.append("title", newTitle.trim());
        formData.append("category", newCategory);
        formData.append("description", newDescription.trim());
        if (useUrlMode && imageUrlInput.trim()) {
          formData.append("imageUrl", imageUrlInput.trim());
        } else if (imageFile) {
          formData.append("image", imageFile);
        }

        const res = await api.post("/documents", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (res.data?.success) {
          createdDoc = res.data.data;
        }
      } catch (backendErr) {
        console.warn("Backend upload failed, persisting locally in browser:", backendErr.message);
      }

      // If backend was not reached or returned error, save locally
      if (!createdDoc) {
        createdDoc = {
          _id: "local-" + Date.now(),
          title: newTitle.trim(),
          category: newCategory,
          description: newDescription.trim(),
          imageUrl: useUrlMode ? imageUrlInput.trim() : imagePreview,
          uploadedBy: user?.name || "Manager",
          uploadedByRole: "Manager",
          createdAt: new Date().toISOString(),
          isLocal: true,
        };

        const existingCustom = JSON.parse(localStorage.getItem("company_documents_custom") || "[]");
        const updatedCustom = [createdDoc, ...existingCustom];
        localStorage.setItem("company_documents_custom", JSON.stringify(updatedCustom));
      }

      setDocuments((prev) => [createdDoc, ...prev]);
      showToast("Document image added successfully!", "success");

      // Reset Form and Close Modal
      setNewTitle("");
      setNewCategory("KYC & Identity");
      setNewDescription("");
      setImageFile(null);
      setImagePreview(null);
      setImageUrlInput("");
      setUseUrlMode(false);
      setIsUploadModalOpen(false);
    } catch (err) {
      console.error("Upload error:", err);
      showToast("Failed to add document image.", "error");
    } finally {
      setUploadLoading(false);
    }
  };

  // Handle Manager Delete Document
  const handleDeleteDocument = async (docId) => {
    if (!isManager) {
      showToast("Only managers are allowed to delete documents.", "error");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this document image?")) {
      return;
    }

    try {
      if (!docId.startsWith("local-")) {
        try {
          await api.delete(`/documents/${docId}`);
        } catch (e) {
          console.warn("Backend delete call error:", e.message);
        }
      }

      // Also clean up local storage if exists
      const existingCustom = JSON.parse(localStorage.getItem("company_documents_custom") || "[]");
      const updatedCustom = existingCustom.filter((d) => d._id !== docId);
      localStorage.setItem("company_documents_custom", JSON.stringify(updatedCustom));

      setDocuments((prev) => prev.filter((d) => d._id !== docId));
      showToast("Document deleted successfully!", "success");
    } catch (err) {
      console.error("Error deleting document:", err);
      showToast("Failed to delete document.", "error");
    }
  };

  // Open Lightbox
  const openLightbox = (doc) => {
    setPreviewDoc(doc);
    setZoomLevel(1);
    setRotation(0);
  };

  const closeLightbox = () => {
    setPreviewDoc(null);
    setZoomLevel(1);
    setRotation(0);
  };

  const handleDownload = (doc) => {
    const link = document.createElement("a");
    link.href = resolveImageUrl(doc.imageUrl);
    link.download = `${doc.title.replace(/\s+/g, "_")}.jpg`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and Search logic
  const filteredDocuments = documents.filter((doc) => {
    const matchCategory = selectedCategory === "All" || doc.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen space-y-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md ${
              toast.type === "success"
                ? "bg-emerald-50/95 text-emerald-900 border-emerald-300 shadow-emerald-500/10"
                : "bg-rose-50/95 text-rose-900 border-rose-300 shadow-rose-500/10"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
            ) : (
              <AlertCircle className="text-rose-600 shrink-0" size={20} />
            )}
            <span className="text-sm font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm border-l-8 border-l-[#162335] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#162335]/5 border border-[#162335]/10 flex items-center justify-center text-[#162335]">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[#162335] tracking-tight">
                Document Library
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                Official document checklists, identification samples, and loan verification formats.
              </p>
            </div>
          </div>
        </div>

        {/* Manager-Only Add Image Button */}
        {isManager ? (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-xs md:text-sm text-white bg-[#162335] hover:bg-[#162335]/90 transition shadow-lg shadow-[#162335]/20 hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus size={18} />
            Add Document Image
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200">
            <Eye size={14} className="text-slate-400" />
            Employee View (Reference Only)
          </div>
        )}
      </div>

      {/* Controls: Search & Category Filter */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents by name or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs md:text-sm font-medium text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:border-[#162335] focus:ring-2 focus:ring-[#162335]/20 outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="text-xs font-bold text-slate-500 self-end sm:self-center">
            Showing <span className="text-[#162335] font-black">{filteredDocuments.length}</span> documents
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
            <Filter size={13} /> Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                selectedCategory === cat
                  ? "bg-[#162335] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Document Gallery Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#162335]/20 border-t-[#162335] rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-bold text-slate-500">Loading document library...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-4">
            <ImageIcon size={32} />
          </div>
          <h3 className="text-lg font-bold text-[#162335] mb-1">No documents found</h3>
          <p className="text-xs text-slate-500 mb-6">
            {searchQuery || selectedCategory !== "All"
              ? "Try adjusting your search query or selected category filter."
              : isManager
              ? "Get started by adding your first document image."
              : "No documents have been uploaded by the manager yet."}
          </p>
          {isManager && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#162335] text-white text-xs font-bold shadow-md hover:bg-[#162335]/90 transition"
            >
              <Plus size={16} /> Add Document Image
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <motion.div
              layout
              key={doc._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group"
            >
              {/* Image Preview Box */}
              <div 
                onClick={() => openLightbox(doc)}
                className="relative aspect-4/3 bg-slate-100 overflow-hidden cursor-pointer group"
              >
                <img
                  src={resolveImageUrl(doc.imageUrl)}
                  alt={doc.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.opacity = "0.4";
                  }}
                />
                <div className="absolute inset-0 bg-[#162335]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-xl text-xs font-black text-[#162335] flex items-center gap-1.5 shadow-lg">
                    <Maximize2 size={13} /> Click to View
                  </span>
                </div>

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white/95 text-[#162335] shadow-sm backdrop-blur-xs">
                    {doc.category || "General"}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-[#162335] text-sm md:text-base leading-snug line-clamp-1 group-hover:text-blue-950 transition-colors">
                    {doc.title}
                  </h3>
                  {doc.description ? (
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 font-normal leading-relaxed">
                      {doc.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1.5 italic">Official verification reference.</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Calendar size={12} />
                    {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "Active"}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* View Button */}
                    <button
                      onClick={() => openLightbox(doc)}
                      className="p-2 text-slate-600 hover:text-[#162335] hover:bg-slate-100 rounded-lg transition"
                      title="Inspect Image"
                    >
                      <Eye size={15} />
                    </button>

                    {/* Download Button */}
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Download Image"
                    >
                      <Download size={15} />
                    </button>

                    {/* Manager-Only Delete Button */}
                    {isManager && (
                      <button
                        onClick={() => handleDeleteDocument(doc._id)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Document"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── MANAGER ONLY: Add Document Image Modal ── */}
      <AnimatePresence>
        {isManager && isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg z-50 overflow-hidden flex flex-col max-h-[92vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#162335]/10 flex items-center justify-center text-[#162335]">
                    <Upload size={16} />
                  </div>
                  <h3 className="font-black text-[#162335] text-base md:text-lg">
                    Add Document Image
                  </h3>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition p-1"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleUploadSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3 Months Salary Slip Standard Format"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:border-[#162335] focus:ring-2 focus:ring-[#162335]/20 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-[#162335] focus:ring-2 focus:ring-[#162335]/20 outline-none transition cursor-pointer"
                  >
                    <option value="KYC & Identity">KYC & Identity</option>
                    <option value="Banking & Income">Banking & Income</option>
                    <option value="Property Documents">Property Documents</option>
                    <option value="Checklists">Checklists</option>
                    <option value="General">General</option>
                  </select>
                </div>

                {/* Upload Toggle: File Upload vs URL */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Document Image *
                    </label>
                    <button
                      type="button"
                      onClick={() => setUseUrlMode(!useUrlMode)}
                      className="text-xs text-blue-600 hover:underline font-bold"
                    >
                      {useUrlMode ? "Switch to File Upload" : "Switch to Image URL"}
                    </button>
                  </div>

                  {!useUrlMode ? (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                      />

                      {imagePreview ? (
                        <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 aspect-16/9 flex items-center justify-center">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-rose-600 text-white rounded-xl transition shadow-md"
                            title="Remove image"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-200 hover:border-[#162335] rounded-2xl p-6 text-center cursor-pointer bg-slate-50/70 hover:bg-slate-50 transition group"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#162335] mx-auto mb-2 shadow-xs transition">
                            <Upload size={22} />
                          </div>
                          <p className="text-sm font-bold text-[#162335]">Click to select an image</p>
                          <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, JPEG, WEBP (Max 15MB)</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        placeholder="https://example.com/document-sample.jpg"
                        value={imageUrlInput}
                        onChange={(e) => {
                          setImageUrlInput(e.target.value);
                          setImagePreview(e.target.value);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:border-[#162335] focus:ring-2 focus:ring-[#162335]/20 outline-none transition"
                      />
                      {imageUrlInput && (
                        <div className="mt-2 rounded-xl border border-slate-200 overflow-hidden aspect-16/9 bg-slate-50">
                          <img
                            src={imageUrlInput}
                            alt="Preview"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Description / Verification Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Ensure seal is visible and all 6 months are continuous..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs md:text-sm font-medium text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:border-[#162335] focus:ring-2 focus:ring-[#162335]/20 outline-none transition resize-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadLoading}
                    className="px-6 py-2.5 rounded-xl font-black text-xs text-white bg-[#162335] hover:bg-[#162335]/90 transition shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {uploadLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Save Document Image"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── LIGHTBOX / FULL IMAGE VIEWER (Both Manager & Employee) ── */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[94vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Lightbox Header */}
              <div className="px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4 text-white shrink-0">
                <div>
                  <h3 className="font-bold text-sm md:text-base text-slate-100 truncate max-w-md">
                    {previewDoc.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <span className="text-blue-400 font-bold">{previewDoc.category}</span>
                    <span>•</span>
                    <span>{new Date(previewDoc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
                    className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
                    className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
                    title="Rotate 90°"
                  >
                    <RotateCw size={16} />
                  </button>
                  <button
                    onClick={() => handleDownload(previewDoc)}
                    className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
                    title="Download Image"
                  >
                    <Download size={16} />
                  </button>
                  <div className="h-5 w-px bg-slate-800 mx-1" />
                  <button
                    onClick={closeLightbox}
                    className="p-2 text-slate-300 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                    title="Close"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Lightbox Image Stage */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/70 select-none custom-scrollbar">
                <img
                  src={resolveImageUrl(previewDoc.imageUrl)}
                  alt={previewDoc.title}
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transition: "transform 0.2s ease-out",
                  }}
                  className="max-h-[72vh] max-w-full object-contain rounded-lg shadow-2xl"
                />
              </div>

              {/* Lightbox Footer Notes */}
              {previewDoc.description && (
                <div className="px-6 py-3 bg-slate-900 border-t border-slate-800/80 text-xs text-slate-300 font-medium shrink-0">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-2">Note:</span>
                  {previewDoc.description}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
