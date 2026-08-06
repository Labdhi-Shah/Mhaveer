import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, CheckCircle, AlertCircle, RefreshCw, LogIn, Trash2, ArrowRight, UploadCloud, Camera, Folder, X, User, Phone, Mail, DollarSign, Loader2
} from "lucide-react";
import api from "../../api";
import "../SalesDashboard/SalesDashboard.css"; // Reuse premium upload grid css styles

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

export default function SalesRegistration() {
  const [customer, setCustomer] = useState({
    fullName: "",
    email: "",
    phone: "",
    loanType: "Business Loan",
    loanAmount: ""
  });
  
  const [customerId, setCustomerId] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Monitor screen width for mobile actions
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize(); // Initialize on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Show toast utility
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCustomer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Register Customer first before allowing uploads
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!customer.fullName || !customer.email || !customer.phone || !customer.loanAmount) {
      showToast("Please fill all customer fields first.", "error");
      return;
    }

    if (!/^\d{10}$/.test(customer.phone)) {
      showToast("Phone number must be exactly 10 digits.", "error");
      return;
    }

    setFormLoading(true);
    try {
      const res = await api.post("/customers", {
        ...customer,
        loanAmount: Number(customer.loanAmount)
      });
      if (res.data.success) {
        setCustomerId(res.data.data._id);
        showToast("Customer profile created! You can now upload the documents below.", "success");
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to register customer.", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveFile = async (docId) => {
    if (!customerId) return;
    try {
      const res = await api.delete(`/customers/${customerId}/document/${docId}`);
      if (res.data.success) {
        setUploadedFiles((prev) => {
          const updated = { ...prev };
          delete updated[docId];
          return updated;
        });
        const docTitle = REQUIRED_DOCUMENTS.find(d => d.id === docId)?.title || "Document";
        showToast(`${docTitle} removed successfully.`, "success");
      }
    } catch (err) {
      showToast("Failed to delete document from server.", "error");
    }
  };

  const handleUploadComplete = async (docId, file) => {
    if (!customerId) {
      showToast("Please save the customer information first by clicking 'Register Customer details' above.", "error");
      return;
    }

    // Front-end Validation
    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    const isImage = ["jpg", "jpeg", "png"].includes(fileExtension);
    const isPdf = fileExtension === "pdf";

    if (!validTypes.includes(file.type) && !isImage && !isPdf) {
      setUploadErrors(prev => ({ ...prev, [docId]: "Invalid file type. Only PDF, PNG, JPG, JPEG are allowed." }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadErrors(prev => ({ ...prev, [docId]: "File size exceeds 10 MB." }));
      return;
    }

    setUploadErrors(prev => ({ ...prev, [docId]: null }));
    setUploadProgress(prev => ({ ...prev, [docId]: 0 }));

    // Prepare multipart data
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post(`/customers/${customerId}/upload/${docId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [docId]: percent }));
        }
      });

      if (res.data.success) {
        let previewUrl = null;
        if (file.type.startsWith("image/") || isImage) {
          previewUrl = URL.createObjectURL(file);
        }

        setUploadedFiles(prev => ({
          ...prev,
          [docId]: {
            name: file.name,
            size: file.size,
            type: file.type,
            preview: previewUrl
          }
        }));

        const docTitle = REQUIRED_DOCUMENTS.find(d => d.id === docId)?.title || "Document";
        showToast(`${docTitle} uploaded successfully.`, "success");
      }
    } catch (err) {
      console.error(err);
      setUploadErrors(prev => ({ ...prev, [docId]: err.response?.data?.message || "Upload failed." }));
    } finally {
      setUploadProgress(prev => {
        const updated = { ...prev };
        delete updated[docId];
        return updated;
      });
    }
  };

  const handleResetForm = () => {
    const confirmReset = window.confirm("Are you sure you want to clear the form? This will remove all progress.");
    if (confirmReset) {
      setCustomer({
        fullName: "",
        email: "",
        phone: "",
        loanType: "Business Loan",
        loanAmount: ""
      });
      setCustomerId(null);
      setUploadedFiles({});
      setUploadErrors({});
      setUploadProgress({});
      showToast("Form reset completed.", "success");
    }
  };

  const handleSubmitDocuments = (e) => {
    e.preventDefault();
    const missingDocs = REQUIRED_DOCUMENTS.filter(doc => !uploadedFiles[doc.id]);
    if (missingDocs.length > 0) {
      showToast(`Please upload all required files. (${missingDocs.length} remaining)`, "error");
      return;
    }

    setShowSuccessModal(true);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setCustomer({
      fullName: "",
      email: "",
      phone: "",
      loanType: "Business Loan",
      loanAmount: ""
    });
    setCustomerId(null);
    setUploadedFiles({});
    showToast("Form submitted and reset.", "success");
  };

  const allUploaded = REQUIRED_DOCUMENTS.every(doc => !!uploadedFiles[doc.id]) && !!customerId;
  const uploadedCount = Object.keys(uploadedFiles).length;
  const percentComplete = Math.round((uploadedCount / REQUIRED_DOCUMENTS.length) * 100);

  return (
    <div className="loan-upload-container">
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border animate-bounce ${
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
        </div>
      )}

      {/* Page Header */}
      <div className="loan-upload-header">
        <p>Sales Department Portal</p>
        <h1>Customer Registration & Loan Application</h1>
      </div>

      {/* Customer Info Form */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#0a2540] flex items-center gap-2 border-b pb-2">
          <User size={16} className="text-[#d4af37]" /> Customer General Information
        </h3>
        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Customer Full Name *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <User size={14} />
              </span>
              <input
                type="text"
                name="fullName"
                required
                disabled={!!customerId}
                placeholder="Enter customer full name"
                value={customer.fullName}
                onChange={handleFormChange}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Email Address *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail size={14} />
              </span>
              <input
                type="email"
                name="email"
                required
                disabled={!!customerId}
                placeholder="customer@email.com"
                value={customer.email}
                onChange={handleFormChange}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Phone size={14} />
              </span>
              <input
                type="tel"
                name="phone"
                required
                disabled={!!customerId}
                placeholder="Enter 10-digit number"
                value={customer.phone}
                onChange={handleFormChange}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Loan Type *</label>
            <select
              name="loanType"
              disabled={!!customerId}
              value={customer.loanType}
              onChange={handleFormChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#0a2540] font-bold outline-none focus:border-[#d4af37] disabled:opacity-60 cursor-pointer"
            >
              <option value="Home Loan">Home Loan</option>
              <option value="Business Loan">Business Loan</option>
              <option value="Property Loan">Property Loan</option>
              <option value="Personal Loan">Personal Loan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Requested Loan Amount (INR) *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <DollarSign size={14} />
              </span>
              <input
                type="number"
                name="loanAmount"
                required
                disabled={!!customerId}
                placeholder="e.g. 500000"
                value={customer.loanAmount}
                onChange={handleFormChange}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex items-end">
            {!customerId ? (
              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-[#0a2540] hover:bg-[#1a3a5f] text-[#d4af37] font-black uppercase text-xs tracking-wider py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {formLoading ? <Loader2 className="animate-spin" size={14} /> : "Register Customer Details"}
              </button>
            ) : (
              <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs text-center py-3 rounded-xl">
                ✓ Customer Registered ({customerId.slice(-6).toUpperCase()})
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Main Upload Cards grid */}
      <form onSubmit={handleSubmitDocuments} className="space-y-6">
        <div className="upload-grid">
          {REQUIRED_DOCUMENTS.map((doc) => {
            const file = uploadedFiles[doc.id];
            const progress = uploadProgress[doc.id];
            const error = uploadErrors[doc.id];

            return (
              <UploadCard
                key={doc.id}
                id={doc.id}
                title={doc.title}
                file={file}
                progress={progress}
                error={error}
                onUpload={(f) => handleUploadComplete(doc.id, f)}
                onRemove={() => handleRemoveFile(doc.id)}
                isMobile={isMobile}
                disabled={!customerId}
              />
            );
          })}
        </div>

        {/* Footer Actions Panel */}
        <div className="dashboard-actions-panel">
          <div className="actions-left-buttons">
            <button
              type="button"
              className="btn-reset"
              onClick={handleResetForm}
              title="Reset Upload status"
            >
              Reset Form
            </button>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5">
            <div className="completion-percentage-notice">
              Uploaded: <span style={{ color: "#0a2540", fontWeight: 900 }}>{uploadedCount} / {REQUIRED_DOCUMENTS.length}</span> ({percentComplete}%)
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={!allUploaded}
              title={allUploaded ? "Submit Documents" : "Upload all 8 documents to enable submission"}
            >
              Submit Loan Application <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </form>

      {/* Submission Success Modal */}
      {showSuccessModal && (
        <div className="success-modal-backdrop" onClick={handleCloseSuccessModal}>
          <div className="success-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="success-modal-icon">
              <CheckCircle size={36} />
            </div>
            <h2>Submission Successful</h2>
            <p>
              Your Customer Registration & Loan Application has been submitted successfully to the backend database.
            </p>

            <div className="success-modal-summary">
              <h4>Uploaded Files Summary</h4>
              <ul className="summary-list">
                {REQUIRED_DOCUMENTS.map((doc) => (
                  <li key={doc.id} className="summary-item">
                    <span className="summary-item-name">{doc.title}</span>
                    <span className="summary-item-status">✓ {uploadedFiles[doc.id]?.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              className="btn-close-modal"
              onClick={handleCloseSuccessModal}
            >
              Close & Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Upload Card Sub-component
function UploadCard({ id, title, file, progress, error, onUpload, onRemove, isMobile, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) onUpload(selected);
  };

  const processDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || progress !== undefined) return;
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) onUpload(droppedFile);
  };

  const triggerUploadClick = (e) => {
    e.stopPropagation();
    if (disabled || progress !== undefined) return;
    if (isMobile) {
      setShowBottomSheet(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`upload-card ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}>
      <div className="card-title-bar">
        <h4 className="card-title text-xs font-black text-[#0a2540]">
          {title}
          <span className="required-badge">*</span>
        </h4>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf, image/jpeg, image/png, image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {!file && progress === undefined && (
        <div
          className={`dropzone-container flex-grow flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 transition ${
            isDragging ? "border-[#d4af37] bg-yellow-50/20" : "hover:border-[#0a2540] hover:bg-slate-100/60"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={processDrop}
          onClick={triggerUploadClick}
        >
          <UploadCloud size={32} className="text-slate-400 mb-2" />
          <p className="text-[11px] text-slate-600">
            <span className="font-extrabold text-[#0a2540] underline">Click to upload</span> or drag and drop
          </p>
          <p className="text-[9px] text-slate-400 mt-1">PDF, PNG, JPG, or JPEG (Max 10MB)</p>
        </div>
      )}

      {progress !== undefined && (
        <div className="progress-area py-8 flex flex-col justify-center flex-grow">
          <div className="progress-header flex justify-between text-[10px] font-extrabold text-slate-500 mb-1">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar-track w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="progress-bar-fill h-full bg-[#0a2540]" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {file && progress === undefined && (
        <div className="preview-container flex flex-col items-center justify-center flex-grow bg-slate-50 border border-slate-200 rounded-xl p-3">
          {file.preview ? (
            <div className="image-preview-wrapper w-full h-24 rounded-lg overflow-hidden border border-slate-300 bg-slate-200 flex items-center justify-center mb-2">
              <img src={file.preview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="pdf-icon-wrapper w-12 h-12 bg-rose-50 border border-rose-200 text-rose-500 rounded-lg flex items-center justify-center mb-2">
              <FileText size={24} />
            </div>
          )}
          <span className="text-[10px] font-bold text-slate-700 w-full text-center truncate px-1" title={file.name}>
            {file.name}
          </span>
          <span className="text-[9px] text-slate-400">{formatFileSize(file.size)}</span>
          <div className="status-msg-success text-[9px] text-emerald-600 flex items-center gap-1 mt-1 font-bold">
            <CheckCircle size={10} /> Ready for verification
          </div>
        </div>
      )}

      {error && (
        <div className="status-msg-error text-[9px] text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded-lg flex items-center gap-1.5 mt-2 font-bold">
          <AlertCircle size={12} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {file && progress === undefined && (
        <div className="card-action-triggers flex gap-2 mt-3">
          <button
            type="button"
            className="btn-replace flex-1 py-1.5 border border-[#0a2540] text-[#0a2540] hover:bg-slate-50 rounded-lg text-[10px] font-black transition flex items-center justify-center gap-1 cursor-pointer"
            onClick={triggerUploadClick}
          >
            <RefreshCw size={10} /> Replace
          </button>
          <button
            type="button"
            className="btn-remove flex-1 py-1.5 border border-rose-500 text-rose-500 hover:bg-rose-50 rounded-lg text-[10px] font-black transition flex items-center justify-center gap-1 cursor-pointer"
            onClick={onRemove}
          >
            <Trash2 size={10} /> Remove
          </button>
        </div>
      )}

      {showBottomSheet && (
        <div className="bottom-sheet-backdrop" onClick={() => setShowBottomSheet(false)}>
          <div className="bottom-sheet-container" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-header">
              <h5 className="bottom-sheet-title">Upload {title}</h5>
              <button type="button" className="bottom-sheet-close-btn" onClick={() => setShowBottomSheet(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="bottom-sheet-options">
              <button
                type="button"
                className="bottom-sheet-option-btn"
                onClick={() => { setShowBottomSheet(false); cameraInputRef.current?.click(); }}
              >
                📷 Take Photo / Camera
              </button>
              <button
                type="button"
                className="bottom-sheet-option-btn"
                onClick={() => { setShowBottomSheet(false); fileInputRef.current?.click(); }}
              >
                📁 Select Document / Files
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
