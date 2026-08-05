import React, { useState, useRef } from "react";
import { UploadCloud, FileText, Trash2, RefreshCw, X, Camera, Folder, CheckCircle, AlertCircle } from "lucide-react";

export default function DocumentUploadCard({
  id,
  title,
  isRequired = true,
  file,
  onUploadComplete,
  onRemove,
  isMobile
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // File size formatter utility
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Validate and start file upload process
  const processFile = (selectedFile) => {
    if (!selectedFile) return;

    // Validate type: PDF, JPG, JPEG, PNG
    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
    const isImageExt = ["jpg", "jpeg", "png"].includes(fileExtension);
    const isPdfExt = fileExtension === "pdf";

    if (!validTypes.includes(selectedFile.type) && !isImageExt && !isPdfExt) {
      setError("Invalid format. Only PDF, JPG, JPEG, PNG are allowed.");
      return;
    }

    // Validate size: max 10MB
    const maxSizeBytes = 10 * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      setError("File exceeds 10 MB limit.");
      return;
    }

    // Clear previous errors and states
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    // Mock uploading progress animation
    const totalDuration = 1500; // 1.5 seconds upload
    const intervalTime = 100;
    const step = 100 / (totalDuration / intervalTime);

    const timer = setInterval(() => {
      setUploadProgress((prevProgress) => {
        const nextProgress = prevProgress + step + Math.random() * 5;
        if (nextProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsUploading(false);
            
            // Create object URL for local preview if it is an image
            let previewUrl = null;
            if (selectedFile.type.startsWith("image/") || isImageExt) {
              previewUrl = URL.createObjectURL(selectedFile);
            }
            
            onUploadComplete(id, {
              name: selectedFile.name,
              size: selectedFile.size,
              type: selectedFile.type || (isPdfExt ? "application/pdf" : "image/" + fileExtension),
              preview: previewUrl,
              rawFile: selectedFile // Keep reference to raw file in state
            });
          }, 200);
          return 100;
        }
        return nextProgress;
      });
    }, intervalTime);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Disable drag drop dropzone during active uploading
    if (isUploading) return;

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const triggerUploadClick = (e) => {
    e.stopPropagation();
    if (isUploading) return;

    if (isMobile) {
      // Show custom bottom sheet on mobile devices
      setShowBottomSheet(true);
    } else {
      // Direct file chooser on desktop
      fileInputRef.current?.click();
    }
  };

  const handleCameraOption = () => {
    setShowBottomSheet(false);
    cameraInputRef.current?.click();
  };

  const handleFilesOption = () => {
    setShowBottomSheet(false);
    fileInputRef.current?.click();
  };

  return (
    <div className="upload-card">
      <div className="card-title-bar">
        <h4 className="card-title">
          {title}
          {isRequired && <span className="required-badge">*</span>}
        </h4>
      </div>

      {/* Hidden inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf, image/jpeg, image/png, image/jpg"
        onChange={handleFileChange}
        className="hidden-file-input"
        id={`file-input-${id}`}
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden-file-input"
        id={`camera-input-${id}`}
      />

      {/* Conditional Rendering: Upload Area vs Uploading vs Upload Completed Previews */}
      {!file && !isUploading && (
        <div
          className={`dropzone-container ${isDragging ? "drag-over" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerUploadClick}
        >
          <UploadCloud size={32} className="upload-placeholder-icon" />
          <p className="dropzone-text">
            <span>Click to upload</span> or drag and drop
          </p>
          <p className="dropzone-subtext">PDF, PNG, JPG, or JPEG (Max 10MB)</p>
        </div>
      )}

      {isUploading && (
        <div className="progress-area">
          <div className="progress-header">
            <span>Uploading document...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {file && !isUploading && (
        <div className="preview-container">
          {file.preview ? (
            <div className="image-preview-wrapper">
              <img
                src={file.preview}
                alt={`${title} Preview`}
                className="image-preview"
              />
            </div>
          ) : (
            <div className="pdf-icon-wrapper">
              <FileText size={32} />
            </div>
          )}

          <div className="uploaded-filename-text" title={file.name}>
            {file.name}
          </div>
          <div className="uploaded-filesize-text">
            {formatFileSize(file.size)}
          </div>
          
          <div className="status-msg-success">
            <CheckCircle size={12} /> Ready for submission
          </div>
        </div>
      )}

      {/* Validation / Error Messages */}
      {error && !isUploading && (
        <div className="status-msg-error">
          <AlertCircle size={12} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action buttons (Replace / Remove) */}
      {file && !isUploading && (
        <div className="card-action-triggers">
          <button
            type="button"
            className="btn-replace"
            onClick={triggerUploadClick}
            title="Replace File"
          >
            <RefreshCw size={12} /> Replace
          </button>
          <button
            type="button"
            className="btn-remove"
            onClick={() => onRemove(id)}
            title="Remove File"
          >
            <Trash2 size={12} /> Remove
          </button>
        </div>
      )}

      {/* Mobile Bottom Sheet Modal */}
      {showBottomSheet && (
        <div
          className="bottom-sheet-backdrop"
          onClick={() => setShowBottomSheet(false)}
        >
          <div
            className="bottom-sheet-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bottom-sheet-header">
              <h5 className="bottom-sheet-title">Upload {title}</h5>
              <button
                type="button"
                className="bottom-sheet-close-btn"
                onClick={() => setShowBottomSheet(false)}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="bottom-sheet-options">
              <button
                type="button"
                className="bottom-sheet-option-btn"
                onClick={handleCameraOption}
              >
                <Camera size={18} />
                <span>📷 Take Photo / Camera</span>
              </button>
              <button
                type="button"
                className="bottom-sheet-option-btn"
                onClick={handleFilesOption}
              >
                <Folder size={18} />
                <span>📁 Select Document / Files</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
