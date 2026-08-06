import React, { useState, useEffect } from "react";
import { FileText, CheckCircle, AlertCircle, RefreshCw, LogIn, Trash2, ArrowRight } from "lucide-react";
import DocumentUploadCard from "./DocumentUploadCard";
import "./SalesDashboard.css";

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

export default function SalesDashboard() {

  const [uploadedFiles, setUploadedFiles] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Monitor screen width for mobile actions
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize(); // Initialize on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load Draft from LocalStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem("loan_docs_draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        // Draft files won't have valid blob preview URLs, so preview is null.
        // They are loaded with an isDraft flag.
        setUploadedFiles(parsed);
        showToast("Restored your previous draft.", "success");
      } catch (err) {
        console.error("Error loading draft", err);
      }
    }
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUploadComplete = (docId, fileInfo) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [docId]: fileInfo
    }));

    // Find the title for the uploaded document to customize the message
    const docTitle = REQUIRED_DOCUMENTS.find(d => d.id === docId)?.title || "Document";
    showToast(`${docTitle} uploaded successfully.`, "success");
  };

  const handleRemoveFile = (docId) => {
    setUploadedFiles((prev) => {
      const updated = { ...prev };
      delete updated[docId];
      return updated;
    });

    const docTitle = REQUIRED_DOCUMENTS.find(d => d.id === docId)?.title || "Document";
    showToast(`${docTitle} removed.`, "success");
  };

  // Save Draft to LocalStorage
  const handleSaveDraft = () => {
    if (Object.keys(uploadedFiles).length === 0) {
      showToast("No files uploaded to save in draft.", "error");
      return;
    }

    // Strip rawFile from metadata before saving to localStorage
    const draftData = {};
    Object.keys(uploadedFiles).forEach((key) => {
      const { name, size, type, preview } = uploadedFiles[key];
      draftData[key] = {
        name,
        size,
        type,
        preview, // Saved as string URL (might not load preview on refresh, but metadata is fine)
        isDraft: true
      };
    });

    localStorage.setItem("loan_docs_draft", JSON.stringify(draftData));
    showToast("Draft saved successfully!", "success");
  };

  // Reset Form state
  const handleResetForm = () => {
    const confirmReset = window.confirm("Are you sure you want to clear the form? This will remove all uploaded files and drafts.");
    if (confirmReset) {
      setUploadedFiles({});
      localStorage.removeItem("loan_docs_draft");
      showToast("Form reset completed.", "success");
    }
  };

  // Submit Documents
  const handleSubmitDocuments = (e) => {
    e.preventDefault();

    // Verify all 8 files are uploaded
    const missingDocs = REQUIRED_DOCUMENTS.filter(doc => !uploadedFiles[doc.id]);
    if (missingDocs.length > 0) {
      showToast(`Please upload all required files. (${missingDocs.length} remaining)`, "error");
      return;
    }

    // Success Modal
    setShowSuccessModal(true);
    localStorage.removeItem("loan_docs_draft"); // Clear draft upon successful submission
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setUploadedFiles({}); // Clear form on submission close
    showToast("Form submitted. Dashboard reset.", "success");
  };

  // Check if all files are uploaded
  const allUploaded = REQUIRED_DOCUMENTS.every(doc => !!uploadedFiles[doc.id]);
  const uploadedCount = Object.keys(uploadedFiles).length;
  const percentComplete = Math.round((uploadedCount / REQUIRED_DOCUMENTS.length) * 100);

  return (
    <div className="loan-upload-container">
      {/* Toast Alert popup */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border animate-bounce ${toast.type === "success"
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
        <h1>Sales Department Dashboard</h1>
      </div>

      {/* Main Upload Cards grid */}
      <form onSubmit={handleSubmitDocuments} className="space-y-6">
        <div className="upload-grid">
          {REQUIRED_DOCUMENTS.map((doc) => (
            <DocumentUploadCard
              key={doc.id}
              id={doc.id}
              title={doc.title}
              isRequired={true}
              file={uploadedFiles[doc.id]}
              onUploadComplete={handleUploadComplete}
              onRemove={handleRemoveFile}
              isMobile={isMobile}
            />
          ))}
        </div>

        {/* Footer Actions Panel */}
        <div className="dashboard-actions-panel">
          <div className="actions-left-buttons">
            <button
              type="button"
              className="btn-draft"
              onClick={handleSaveDraft}
              title="Save Draft to local storage"
            >
              Save Draft
            </button>
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
              Submit Documents <ArrowRight size={14} />
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
              Your loan application documents have been received. The credit analysis department will initiate verification shortly.
            </p>

            <div className="success-modal-summary">
              <h4>Uploaded Files Summary</h4>
              <ul className="summary-list">
                {REQUIRED_DOCUMENTS.map((doc) => {
                  const fileInfo = uploadedFiles[doc.id];
                  return (
                    <li key={doc.id} className="summary-item">
                      <span className="summary-item-name">{doc.title}</span>
                      <span className="summary-item-status">✓ {fileInfo?.name}</span>
                    </li>
                  );
                })}
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
