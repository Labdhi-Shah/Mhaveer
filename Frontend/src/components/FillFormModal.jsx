import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronRight, ChevronLeft, Upload, Camera, FileText,
  CheckCircle, AlertCircle, Trash2, Loader2, User, Briefcase,
  Home, Landmark, ShieldCheck, CreditCard, ArrowRight, RefreshCw, FolderOpen
} from "lucide-react";
import api from "../api";


const LOAN_TYPES = [
  { id: "Property Purchase Loan", title: "Property Purchase Loan", icon: Home, desc: "For buying or constructing a property" },
  { id: "Business Loan", title: "Business Loan", icon: Briefcase, desc: "To expand or fund your business" },
  { id: "Property Loan", title: "Property Loan", icon: Landmark, desc: "Unlock value from residential/commercial property" },
  { id: "Balance Transfer", title: "Balance Transfer", icon: RefreshCw, desc: "Transfer your existing loan" }
];

const ALL_DOCUMENTS = {
  aadhaar: { id: "aadhaar", title: "Aadhaar Card", desc: "Front & Back combined PDF/Image", required: true },
  pan: { id: "pan", title: "PAN Card", desc: "Clear front-side scan", required: true },
  bankStatement: { id: "bankStatement", title: "Bank Statements", desc: "Last 6 months PDF statements", required: true },
  salaryOrItr: { id: "salaryOrItr", title: "Salary Slips", desc: "Recent 3 salary slips", required: true },
  addressProof: { id: "addressProof", title: "Address Proof", desc: "Rent agreement, etc.", required: true },
  businessDocs: { id: "businessDocs", title: "Business Proof", desc: "Trade license, Udyam Aadhaar", required: true },
  propertyDocs: { id: "propertyDocs", title: "Property/Mortgage Documents", desc: "Sale deed, property tax receipt, NOC, etc.", required: true },
  itr: { id: "itr", title: "Income Tax Return (ITR)", desc: "Recent ITR V", required: true },
  gstCertificate: { id: "gstCertificate", title: "GST Certificate", desc: "Valid GST Registration", required: true },
  electricityBill: { id: "electricityBill", title: "Electricity Bill", desc: "Recent utility bill for address proof", required: true }
};

const LOAN_DOCUMENTS_MAPPING = {
  "Property Purchase Loan": ["aadhaar", "pan", "bankStatement", "addressProof", "electricityBill"],
  "Business Loan": ["aadhaar", "pan", "bankStatement", "itr", "gstCertificate", "businessDocs"],
  "Property Loan": ["aadhaar", "pan", "bankStatement", "addressProof", "propertyDocs"],
  "Balance Transfer": ["aadhaar", "pan", "bankStatement", "propertyDocs"]
};

export default function FillFormModal({ isOpen, onClose, selectedMeeting }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [activeDocId, setActiveDocId] = useState(null);
  const [showMobileSourceSelector, setShowMobileSourceSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Form State
  const [loanType, setLoanType] = useState("");
  const [propertyPurchaseCategory, setPropertyPurchaseCategory] = useState("");
  const [ppLocation, setPpLocation] = useState("");
  const [ppMarketRate, setPpMarketRate] = useState("");
  const [ppDastavejRate, setPpDastavejRate] = useState("");
  const [ppDastavejName, setPpDastavejName] = useState("");
  const [propertyLoanCategory, setPropertyLoanCategory] = useState("");
  const [propertyLocation, setPropertyLocation] = useState("");
  const [durationOfRentProperty, setDurationOfRentProperty] = useState("");
  const [lapPropertyType, setLapPropertyType] = useState("");
  const [lapPropertyLocation, setLapPropertyLocation] = useState("");
  const [lapPropertyMarketValue, setLapPropertyMarketValue] = useState("");
    const [lapPropertyWork, setLapPropertyWork] = useState("");
    const [lapPropertyDocumentList, setLapPropertyDocumentList] = useState("");
  const [unsoldUnit, setUnsoldUnit] = useState("");
  const [unsoldMV, setUnsoldMV] = useState("");
  const [businessStartingYear, setBusinessStartingYear] = useState("");
  const [businessTypeOfWork, setBusinessTypeOfWork] = useState("");
const [unsoldBV, setUnsoldBV] = useState(false);
  const [unsoldScheme, setUnsoldScheme] = useState("");
  const [unsoldLocation, setUnsoldLocation] = useState("");
  const [unsoldFloor, setUnsoldFloor] = useState("");
  const [unsoldDastavej, setUnsoldDastavej] = useState("");
  const [unsoldPartnership, setUnsoldPartnership] = useState("");
  const [lrdRent, setLrdRent] = useState("");
  const [lrdMarketValue, setLrdMarketValue] = useState("");
  const [lrdLocation, setLrdLocation] = useState("");
  const [lrdLoiYear, setLrdLoiYear] = useState("");
  const [lrdSchemeName, setLrdSchemeName] = useState("");
  const [lrdDastavej, setLrdDastavej] = useState("");
  const [naPlotLocation, setNaPlotLocation] = useState("");
  const [naPlotMV, setNaPlotMV] = useState("");
  const [naPlotYesNo, setNaPlotYesNo] = useState(false);
  const [naPlotDastavej, setNaPlotDastavej] = useState("");
  const [naPlotVAR, setNaPlotVAR] = useState("");
  const [naPlotScheme, setNaPlotScheme] = useState("");
  const [naPlotLavani, setNaPlotLavani] = useState("");
  const [naPlotVacant, setNaPlotVacant] = useState(false);
  const [businessLoanType, setBusinessLoanType] = useState("");
  const [btBankName, setBtBankName] = useState("");
  const [btRateOfInterest, setBtRateOfInterest] = useState("");
  const [btPropertyType, setBtPropertyType] = useState("");
  const [btMarketValue, setBtMarketValue] = useState("");
  const [btLocation, setBtLocation] = useState("");
  const [btDuration, setBtDuration] = useState("");
  const [btOutstanding, setBtOutstanding] = useState("");
  const [btForeclosureCharge, setBtForeclosureCharge] = useState("");
  const [propertyLoanType, setPropertyLoanType] = useState("");
  const [propertyOwnershipType, setPropertyOwnershipType] = useState("");
  const [propertyDetails, setPropertyDetails] = useState({ propertyType: "", address: "", estimatedValue: "" });
  const [propertyOwners, setPropertyOwners] = useState([{ name: "", contact: "", pan: "", aadhaar: "" }]);

  const [businessType, setBusinessType] = useState("");
  const [businessDetails, setBusinessDetails] = useState({ name: "", type: "", vintage: "", turnover: "" });
  const [proprietorDetails, setProprietorDetails] = useState({ name: "", pan: "", aadhaar: "" });
  const [partners, setPartners] = useState([{ name: "", pan: "", aadhaar: "", share: "" }]);
  const [directors, setDirectors] = useState([{ name: "", pan: "", aadhaar: "", din: "" }]);

  // Step 2 State: Person who met the client
  const [meetingPersonName, setMeetingPersonName] = useState("");
  const [meetingPersonNotes, setMeetingPersonNotes] = useState("");

  // Sync meetingPersonName if already saved; pre-populate loanType and category from lead if available
  useEffect(() => {
    if (selectedMeeting) {
      setMeetingPersonName(selectedMeeting.meetingPersonName || "");
      setMeetingPersonNotes(selectedMeeting.meetingPersonNotes || "");
      if (selectedMeeting.leadId?.loanType && !loanType) {
        setLoanType(selectedMeeting.leadId.loanType);
      }
      if (selectedMeeting.leadId?.propertyLoanCategory && !propertyLoanCategory) {
        setPropertyLoanCategory(selectedMeeting.leadId.propertyLoanCategory);
      }
      if (selectedMeeting.leadId?.propertyPurchaseCategory && !propertyPurchaseCategory) {
        setPropertyPurchaseCategory(selectedMeeting.leadId.propertyPurchaseCategory);
      }
    }
  }, [selectedMeeting]);

  // Lead Creator (Employee Name) automatically fetched from the Lead
  const leadCreatorEmployeeName =
    selectedMeeting?.leadId?.employeeName ||
    selectedMeeting?.employeeName ||
    selectedMeeting?.employeeId?.name ||
    selectedMeeting?.employeeId?.fullName ||
    "N/A";

  const leadCreatorEmpId =
    selectedMeeting?.leadId?.employeeId ||
    selectedMeeting?.employeeId?.employeeId ||
    "";

  // Document State
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Listen to screen size to determine mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(uploadedFiles).forEach(file => {
        if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
      });
    };
  }, [uploadedFiles]);

  if (!isOpen) return null;

  // Step 1 Validation
  const isStep1Valid = () => {
    if (!loanType) return false;
    if (loanType === "Property Purchase Loan") return !!propertyPurchaseCategory && !!ppLocation && !!ppMarketRate && !!ppDastavejRate && !!ppDastavejName;
    if (loanType === "Business Loan") { if (businessLoanType === "Unsecured" && (!businessStartingYear || !businessTypeOfWork)) return false; return !!businessLoanType && !!businessType; }
    if (loanType === "Property Loan") {
      if (!propertyLoanCategory) return false;
      if (["Working Capital"].includes(propertyLoanCategory) && (!propertyLocation || !durationOfRentProperty)) return false;
      if (propertyLoanCategory === "LAP" && (!lapPropertyType || !lapPropertyLocation || !lapPropertyMarketValue || !lapPropertyWork || !lapPropertyDocumentList)) return false;
      if (propertyLoanCategory === "Unsold" && (!unsoldUnit || !unsoldMV || !unsoldBV || !unsoldScheme || !unsoldLocation || !unsoldFloor || !unsoldDastavej || !unsoldPartnership)) return false;
      if (propertyLoanCategory === "LRD" && (!lrdRent || !lrdMarketValue || !lrdLocation || !lrdLoiYear || !lrdSchemeName || !lrdDastavej)) return false;
      if (propertyLoanCategory === "NA Plot" && (!naPlotLocation || !naPlotMV || !naPlotDastavej || !naPlotVAR || !naPlotScheme || !naPlotLavani)) return false;
      return !!propertyLoanType;
    }
    if (loanType === "Balance Transfer") {
      return !!btBankName && !!btRateOfInterest && !!btPropertyType && !!btMarketValue && !!btLocation && !!btDuration && !!btOutstanding && !!btForeclosureCharge;
    }
    return true;
  };

  // Step 2 Validation: Person Name who met the client is required
  const isStep2Valid = () => {
    return meetingPersonName.trim().length > 0;
  };

  // Get active documents list (based on loanType)
  const getActiveDocuments = () => {
    if (!loanType || !LOAN_DOCUMENTS_MAPPING[loanType]) {
      return [];
    }
    return LOAN_DOCUMENTS_MAPPING[loanType].map(docId => ALL_DOCUMENTS[docId]);
  };

  // Array Helpers
  const updateArrayItem = (setter, index, field, value) => {
    setter(prev => {
      const newArr = [...prev];
      newArr[index] = { ...newArr[index], [field]: value };
      return newArr;
    });
  };
  const addArrayItem = (setter, emptyObj) => setter(prev => [...prev, emptyObj]);
  const removeArrayItem = (setter, index) => setter(prev => prev.filter((_, i) => i !== index));

  const handleLoanTypeSelect = (typeId) => {
    setLoanType(typeId);
    if (typeId !== "Property Loan") {
      setPropertyLoanType("");
      setPropertyLoanCategory("");
    }
    if (typeId !== "Property Purchase Loan") {
      setPropertyPurchaseCategory("");
      setPpLocation("");
      setPpMarketRate("");
      setPpDastavejRate("");
      setPpDastavejName("");
    }
    if (typeId !== "Business Loan") setBusinessLoanType("");
  };



  // Upload Logic
  const triggerUpload = (docId) => {
    setActiveDocId(docId);
    if (isMobile) {
      setShowMobileSourceSelector(true);
    } else {
      if (fileInputRef.current) fileInputRef.current.click();
    }
  };

  const handleMobileSourceChoice = (source) => {
    setShowMobileSourceSelector(false);
    if (source === "camera") {
      if (cameraInputRef.current) cameraInputRef.current.click();
    } else {
      if (fileInputRef.current) fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const docId = activeDocId;

    // Validate size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      setUploadErrors(prev => ({ ...prev, [docId]: "File size exceeds the 10 MB limit." }));
      e.target.value = "";
      return;
    }

    // Validate format (PDF, JPG, JPEG, PNG)
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setUploadErrors(prev => ({ ...prev, [docId]: "Invalid file format. Only PDF, JPG, JPEG, and PNG are allowed." }));
      e.target.value = "";
      return;
    }

    // Clear previous errors
    setUploadErrors(prev => {
      const updated = { ...prev };
      delete updated[docId];
      return updated;
    });

    // Simulate progress
    simulateUpload(docId, file);
    e.target.value = "";
  };

  const simulateUpload = (docId, file) => {
    setUploadProgress(prev => ({ ...prev, [docId]: 10 }));
    let progress = 10;
    const interval = setInterval(() => {
      progress += 15;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[docId];
          return updated;
        });

        // Add file details
        const isPdf = file.type === "application/pdf";
        const previewUrl = isPdf ? null : URL.createObjectURL(file);

        setUploadedFiles(prev => ({
          ...prev,
          [docId]: {
            name: file.name,
            size: formatBytes(file.size),
            type: file.type,
            previewUrl,
            rawFile: file
          }
        }));
      } else {
        setUploadProgress(prev => ({ ...prev, [docId]: progress }));
      }
    }, 150);
  };

  const removeFile = (docId) => {
    setUploadedFiles(prev => {
      const updated = { ...prev };
      if (updated[docId] && updated[docId].previewUrl) {
        URL.revokeObjectURL(updated[docId].previewUrl);
      }
      delete updated[docId];
      return updated;
    });
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Submit Handler — POSTs to /api/customers/from-meeting as multipart/form-data
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isStep1Valid() || !isStep2Valid()) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const formData = new FormData();

      // ── Meeting reference ────────────────────────────────────────────────
      const finalCustomerName = selectedMeeting?.customerName || selectedMeeting?.leadId?.contactPerson || selectedMeeting?.leadId?.companyName || "Client";
      const finalCustomerPhone = selectedMeeting?.customerPhone || selectedMeeting?.leadId?.phoneNumber || selectedMeeting?.leadId?.phone || "";
      if (selectedMeeting?._id) formData.append("meetingId", selectedMeeting._id);
      formData.append("customerName", finalCustomerName);
      if (finalCustomerPhone) formData.append("customerPhone", finalCustomerPhone);

      // ── Step 1: Loan type ─────────────────────────────────────────────────
      formData.append("loanType", loanType);
      if (propertyPurchaseCategory) formData.append("propertyPurchaseCategory", propertyPurchaseCategory);
      if (ppLocation) formData.append("ppLocation", ppLocation);
      if (ppMarketRate) formData.append("ppMarketRate", ppMarketRate);
      if (ppDastavejRate) formData.append("ppDastavejRate", ppDastavejRate);
      if (ppDastavejName) formData.append("ppDastavejName", ppDastavejName);
      if (propertyLoanCategory) formData.append("propertyLoanCategory", propertyLoanCategory);
      if (propertyLocation) formData.append("propertyLocation", propertyLocation);
      if (durationOfRentProperty) formData.append("durationOfRentProperty", durationOfRentProperty);
      if (lapPropertyType) formData.append("lapPropertyType", lapPropertyType);
      if (lapPropertyLocation) formData.append("lapPropertyLocation", lapPropertyLocation);
      if (lapPropertyMarketValue) formData.append("lapPropertyMarketValue", lapPropertyMarketValue);
        if (lapPropertyWork) formData.append("lapPropertyWork", lapPropertyWork);
        if (lapPropertyDocumentList) formData.append("lapPropertyDocumentList", lapPropertyDocumentList);
      if (unsoldUnit) formData.append("unsoldUnit", unsoldUnit);
      if (unsoldMV) formData.append("unsoldMV", unsoldMV);
      
      if (unsoldBV) formData.append("unsoldBV", unsoldBV);
      if (unsoldScheme) formData.append("unsoldScheme", unsoldScheme);
      if (unsoldLocation) formData.append("unsoldLocation", unsoldLocation);
      if (unsoldFloor) formData.append("unsoldFloor", unsoldFloor);
      if (unsoldDastavej) formData.append("unsoldDastavej", unsoldDastavej);
      if (unsoldPartnership) formData.append("unsoldPartnership", unsoldPartnership);
      if (lrdRent) formData.append("lrdRent", lrdRent);
      if (lrdMarketValue) formData.append("lrdMarketValue", lrdMarketValue);
      if (lrdLocation) formData.append("lrdLocation", lrdLocation);
      if (lrdLoiYear) formData.append("lrdLoiYear", lrdLoiYear);
      if (lrdSchemeName) formData.append("lrdSchemeName", lrdSchemeName);
      if (lrdDastavej) formData.append("lrdDastavej", lrdDastavej);
      if (naPlotLocation) formData.append("naPlotLocation", naPlotLocation);
      if (naPlotMV) formData.append("naPlotMV", naPlotMV);
      formData.append("naPlotYesNo", naPlotYesNo);
      if (naPlotDastavej) formData.append("naPlotDastavej", naPlotDastavej);
      if (naPlotVAR) formData.append("naPlotVAR", naPlotVAR);
      if (naPlotScheme) formData.append("naPlotScheme", naPlotScheme);
      if (naPlotLavani) formData.append("naPlotLavani", naPlotLavani);
      formData.append("naPlotVacant", naPlotVacant);
      if (businessLoanType) formData.append("businessLoanType", businessLoanType);
      if (businessStartingYear) formData.append("businessStartingYear", businessStartingYear);
      if (businessTypeOfWork) formData.append("businessTypeOfWork", businessTypeOfWork);
      if (btBankName) formData.append("btBankName", btBankName);
      if (btRateOfInterest) formData.append("btRateOfInterest", btRateOfInterest);
      if (btPropertyType) formData.append("btPropertyType", btPropertyType);
      if (btMarketValue) formData.append("btMarketValue", btMarketValue);
      if (btLocation) formData.append("btLocation", btLocation);
      if (btDuration) formData.append("btDuration", btDuration);
      if (btOutstanding) formData.append("btOutstanding", btOutstanding);
      if (btForeclosureCharge) formData.append("btForeclosureCharge", btForeclosureCharge);
      if (propertyLoanType) formData.append("propertyLoanType", propertyLoanType);

      // ── Step 2: Meeting Representative & Lead Creator ────────────────────
      formData.append("meetingPersonName", meetingPersonName.trim());
      formData.append("meetingPersonNotes", meetingPersonNotes.trim());
      formData.append("leadCreatedByName", leadCreatorEmployeeName);

      // ── Documents (append raw File objects if any) ────────────────────────
      Object.entries(uploadedFiles).forEach(([docId, fileObj]) => {
        if (fileObj.rawFile) {
          formData.append(docId, fileObj.rawFile, fileObj.name);
        }
      });

      await api.post("/customers/from-meeting", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setIsSubmitted(true);
    } catch (err) {
      console.error("[FillForm] Submit error:", err);
      const msg = err?.response?.data?.message || "Submission failed. Please try again.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    // Reset State
    setCurrentStep(1);
    setLoanType("");
    setPropertyLoanType("");
    setMeetingPersonName("");
    setMeetingPersonNotes("");
    // Revoke all preview URLs
    Object.values(uploadedFiles).forEach(file => {
      if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
    });
    setUploadedFiles({});
    setUploadErrors({});
    setUploadProgress({});
    const wasSubmitted = isSubmitted;
    setIsSubmitted(false);
    onClose(wasSubmitted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleResetAndClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/jpg,image/png,application/pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-[#f0f4f8] rounded-3xl shadow-2xl w-full max-w-4xl z-50 overflow-hidden flex flex-col max-h-[92vh] border border-slate-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-[#162335] p-1.5 rounded-lg text-[#9ca3af]">
              <FileText size={18} />
            </div>
            <h3 className="font-black text-[#162335] text-base sm:text-lg">
              Customer Loan Application Form
            </h3>
          </div>
          <button
            onClick={handleResetAndClose}
            className="text-slate-400 hover:text-rose-500 transition p-1 rounded-lg hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">

          {/* Stepper Header */}
          {!isSubmitted && (
            <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              {/* Desktop Stepper */}
              <div className="hidden md:flex items-center justify-around">
                <div className={`flex items-center gap-2.5 ${currentStep >= 1 ? "text-[#162335]" : "text-slate-400"}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${currentStep === 1
                    ? "bg-[#162335] text-white ring-4 ring-[#162335]/10"
                    : currentStep > 1
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}>
                    {currentStep > 1 ? "✓" : "01"}
                  </span>
                  <span className={`text-xs uppercase tracking-wider font-extrabold ${currentStep === 1 ? "text-[#162335]" : "text-slate-500"}`}>
                    Loan Requirement
                  </span>
                </div>
                <div className="flex-1 max-w-[80px] h-[2px] bg-slate-200 mx-4" />
                <div className={`flex items-center gap-2.5 ${currentStep >= 2 ? "text-[#162335]" : "text-slate-400"}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${currentStep === 2
                    ? "bg-[#162335] text-white ring-4 ring-[#162335]/10"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}>
                    02
                  </span>
                  <span className={`text-xs uppercase tracking-wider font-extrabold ${currentStep === 2 ? "text-[#162335]" : "text-slate-500"}`}>
                    Client Visit / Representative
                  </span>
                </div>
              </div>

              {/* Mobile Stepper Indicator */}
              <div className="md:hidden flex items-center justify-between">
                <span className="text-xs font-black text-[#162335] uppercase tracking-wider">
                  Step {currentStep} of 2: {
                    currentStep === 1 ? "Loan Requirement" : "Client Visit / Representative"
                  }
                </span>
                <span className="text-xs font-black text-[#162335] bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {Math.round((currentStep / 2) * 100)}%
                </span>
              </div>
              <div className="md:hidden mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#162335] h-full transition-all duration-300"
                  style={{ width: `${(currentStep / 2) * 100}%` }}
                />
              </div>
            </div>
          )}



          {/* Stepper Content */}
          <AnimatePresence mode="wait">
            {isSubmitted ? (
              /* Success Screen */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm flex flex-col items-center justify-center max-w-lg mx-auto my-6"
              >
                <div className="bg-emerald-50 text-emerald-500 p-4 rounded-full mb-4 ring-8 ring-emerald-50">
                  <CheckCircle size={48} className="stroke-[2.5]" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#162335] mb-2">
                  Form Submitted Successfully
                </h2>
                <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
                  The customer loan form and required documents have been successfully submitted.
                </p>

                {/* Summary Box */}
                <div className="w-full text-left bg-slate-50 border border-slate-200 p-4 rounded-2xl mb-6">
                  <h4 className="text-xs font-black text-[#162335] uppercase tracking-wider mb-2 pb-1.5 border-b border-slate-200">
                    Application Summary
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <p className="flex justify-between"><span className="text-slate-400">Loan Type:</span> <strong className="text-[#162335]">{loanType}</strong></p>
                    <p className="flex justify-between"><span className="text-slate-400">Lead Created By:</span> <strong className="text-[#162335] font-black">{leadCreatorEmployeeName}</strong></p>
                    <p className="flex justify-between"><span className="text-slate-400">Pattern Name (Met Client):</span> <strong className="text-emerald-700 font-black">{meetingPersonName || "N/A"}</strong></p>
                    {meetingPersonNotes && (
                      <p className="flex flex-col gap-0.5 pt-1 border-t border-slate-200">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Visit Remarks:</span>
                        <span className="text-slate-700 italic font-medium">{meetingPersonNotes}</span>
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full bg-[#162335] hover:bg-[#162335]/90 text-[#9ca3af] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition shadow-sm"
                >
                  Done / Close
                </button>
              </motion.div>
            ) : currentStep === 1 ? (
              /* Step 1: Loan Requirement */
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-[#162335]">
                  <h2 className="text-base sm:text-lg font-black text-[#162335] flex items-center gap-2">
                    <span className="bg-[#162335]/5 text-[#162335] w-6 h-6 rounded-md flex items-center justify-center text-xs">1</span>
                    Loan Requirement
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Select the financial product needed by the customer to configure validation parameters.
                  </p>
                </div>

                <div className="space-y-6">
                  <span className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    What type of loan does the customer need? *
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                    {LOAN_TYPES.map((type) => {
                      const IconComp = type.icon;
                      const isSelected = loanType === type.id;
                      return (
                        <div
                          key={type.id}
                          onClick={() => handleLoanTypeSelect(type.id)}
                          className={`cursor-pointer bg-white p-4 rounded-2xl border transition duration-300 shadow-sm flex items-start gap-x-6 gap-y-6 hover:shadow ${isSelected
                            ? "border-[#162335] bg-[#162335]/5 ring-2 ring-[#162335]/10"
                            : "border-slate-200 hover:border-[#162335]/30"
                            }`}
                        >
                          <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? "bg-[#162335] text-white" : "bg-slate-100 text-slate-600"
                            }`}>
                            <IconComp size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-[#162335]">{type.title}</h4>
                            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{type.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dynamic UI based on Loan Type */}
                  <AnimatePresence>
                    {/* PROPERTY PURCHASE LOAN UI */}
                    {loanType === "Property Purchase Loan" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-6 overflow-hidden">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                          <h4 className="text-base font-black text-[#162335] border-b pb-3 border-slate-100">Property Purchase Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                            <div className="md:col-span-2">
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Type of Category</label>
                              <select value={propertyPurchaseCategory} onChange={(e) => setPropertyPurchaseCategory(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all">
                                <option value="">Select Category</option>
                                <option value="Home">Home</option>
                                <option value="NA Plot">NA Plot</option>
                                <option value="Commercial">Commercial</option>
                                <option value="Residential">Residential</option>
                                <option value="Industrial">Industrial</option>
                              </select>
                            </div>
                            {propertyPurchaseCategory && (
                              <>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property of Location</label>
                                  <input type="text" placeholder="Enter location" value={ppLocation} onChange={(e) => setPpLocation(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Market Rate</label>
                                  <input type="number" placeholder="Enter market rate" value={ppMarketRate} onChange={(e) => setPpMarketRate(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" min="0" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Document List Rate</label>
                                  <input type="number" placeholder="Enter dastavej rate" value={ppDastavejRate} onChange={(e) => setPpDastavejRate(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" min="0" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Document List Name</label>
                                  <input type="text" placeholder="Enter dastavej name" value={ppDastavejName} onChange={(e) => setPpDastavejName(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* BALANCE TRANSFER UI */}
                    
                            {loanType === "Business Loan" && businessLoanType === "Unsecured" && (
                              <>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Company Starting Year</label>
                                  <input type="text" placeholder="Enter starting year" value={businessStartingYear} onChange={(e) => setBusinessStartingYear(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Type of Work</label>
                                  <input type="text" placeholder="Enter type of work" value={businessTypeOfWork} onChange={(e) => setBusinessTypeOfWork(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                              </>
                            )}

                            {loanType === "Balance Transfer" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-6 overflow-hidden">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                          <h4 className="text-base font-black text-[#162335] border-b pb-3 border-slate-100">Balance Transfer Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Bank Name</label>
                              <input type="text" placeholder="Enter bank name" value={btBankName} onChange={(e) => setBtBankName(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Rate of Interest (%)</label>
                              <input type="number" step="0.01" placeholder="e.g. 8.5" value={btRateOfInterest} onChange={(e) => setBtRateOfInterest(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Type</label>
                              <input type="text" placeholder="Enter property type" value={btPropertyType} onChange={(e) => setBtPropertyType(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Market Value</label>
                              <input type="number" placeholder="Enter market value" value={btMarketValue} onChange={(e) => setBtMarketValue(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property of Location</label>
                              <input type="text" placeholder="Enter Location" value={btLocation} onChange={(e) => setBtLocation(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Duration</label>
                              <input type="text" placeholder="Enter duration" value={btDuration} onChange={(e) => setBtDuration(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                            </div>
                            
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Outstanding</label>
                              <input type="number" placeholder="Enter outstanding" value={btOutstanding} onChange={(e) => setBtOutstanding(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Foreclosure Charge</label>
                              <input type="number" placeholder="Enter foreclosure charge" value={btForeclosureCharge} onChange={(e) => setBtForeclosureCharge(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* PROPERTY LOAN UI */}
                    {loanType === "Property Loan" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-6 overflow-hidden">

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                          <h4 className="text-base font-black text-[#162335] border-b pb-3 mb-4 border-slate-100">Property Loan Requirement</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-4">
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Loan Category</label>
                              <select value={propertyLoanCategory} onChange={(e) => setPropertyLoanCategory(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all">
                                <option value="">Select Category</option>
                                <option value="Working Capital">Working Capital</option>
                                <option value="LAP">LAP</option>
                                <option value="Unsold">Unsold</option>
                                <option value="LRD">LRD</option>
                                <option value="NA Plot">NA Plot</option>
                              </select>
                            </div>
                            
                            {propertyLoanCategory && ["Working Capital"].includes(propertyLoanCategory) && (
                              <>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Location</label>
                                  <input type="text" placeholder="Enter location" value={propertyLocation} onChange={(e) => setPropertyLocation(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Duration of Rent Property</label>
                                  <input type="text" placeholder="e.g. 5 Years" value={durationOfRentProperty} onChange={(e) => setDurationOfRentProperty(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                              </>
                            )}

                            {propertyLoanCategory === "LAP" && (
                              <>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Type</label>
                                  <select value={lapPropertyType} onChange={(e) => setLapPropertyType(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all">
                                    <option value="">Select Property Type</option>
                                    <option value="Commercial">Commercial</option>
                                    <option value="Residential">Residential</option>
                                    <option value="Industrial">Industrial</option>
                                  </select>
                                </div>
                                {lapPropertyType && (
                                  <>
                                    <div>
                                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Location</label>
                                      <input type="text" placeholder="Enter location" value={lapPropertyLocation} onChange={(e) => setLapPropertyLocation(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                    </div>
                                    <div>
                                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Market Value</label>
                                      <input type="number" placeholder="Enter market value" value={lapPropertyMarketValue} onChange={(e) => setLapPropertyMarketValue(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                    </div>
                                      <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Work</label>
                                        <input type="text" placeholder="Enter work" value={lapPropertyWork} onChange={(e) => setLapPropertyWork(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                      </div>
                                      <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Document List</label>
                                        <input type="text" placeholder="Enter document list" value={lapPropertyDocumentList} onChange={(e) => setLapPropertyDocumentList(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                      </div>
                                  </>
                                )}
                              </>
                            )}

                            {propertyLoanCategory === "Unsold" && (
                              <>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Unit</label>
                                  <input type="text" placeholder="Enter unit" value={unsoldUnit} onChange={(e) => setUnsoldUnit(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Property Market Value</label>
                                  <input type="number" placeholder="Enter M.V" value={unsoldMV} onChange={(e) => setUnsoldMV(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" min="0" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">B.U</label>
                                  <div className="flex items-center gap-4">
                                    <button
                                      type="button"
                                      onClick={() => setUnsoldBV(true)}
                                      className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                                        unsoldBV === true
                                          ? "border-[#162335] bg-[#162335]/5 text-[#162335]"
                                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                      }`}
                                    >
                                      Yes
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                        unsoldBV === true
                                          ? "border-[#162335] bg-[#162335]"
                                          : "border-slate-300"
                                      }`}>
                                        {unsoldBV === true && <CheckCircle size={14} className="text-white" />}
                                      </div>
                                    </button>
                                    
                                    <button
                                      type="button"
                                      onClick={() => setUnsoldBV(false)}
                                      className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                                        unsoldBV === false
                                          ? "border-[#162335] bg-[#162335]/5 text-[#162335]"
                                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                      }`}
                                    >
                                      No
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                        unsoldBV === false
                                          ? "border-[#162335] bg-[#162335]"
                                          : "border-slate-300"
                                      }`}>
                                        {unsoldBV === false && <CheckCircle size={14} className="text-white" />}
                                      </div>
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Scheme Name</label>
                                  <input type="text" placeholder="Enter scheme" value={unsoldScheme} onChange={(e) => setUnsoldScheme(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property of Location</label>
                                  <input type="text" placeholder="Enter location" value={unsoldLocation} onChange={(e) => setUnsoldLocation(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Floor</label>
                                  <input type="text" placeholder="Enter floor" value={unsoldFloor} onChange={(e) => setUnsoldFloor(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Document List</label>
                                  <input type="text" placeholder="Enter dastavej" value={unsoldDastavej} onChange={(e) => setUnsoldDastavej(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Partnership</label>
                                  <input type="text" placeholder="Enter partnership" value={unsoldPartnership} onChange={(e) => setUnsoldPartnership(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                              </>
                            )}

                            {propertyLoanCategory === "LRD" && (
                              <>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Rent</label>
                                  <input type="number" placeholder="Enter rent" value={lrdRent} onChange={(e) => setLrdRent(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" min="0" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Market Value</label>
                                  <input type="number" placeholder="Enter market value" value={lrdMarketValue} onChange={(e) => setLrdMarketValue(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" min="0" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property of Location</label>
                                  <input type="text" placeholder="Enter location" value={lrdLocation} onChange={(e) => setLrdLocation(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">LOI Year</label>
                                  <input type="text" placeholder="Enter LOI year" value={lrdLoiYear} onChange={(e) => setLrdLoiYear(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Scheme Name</label>
                                  <input type="text" placeholder="Enter scheme name" value={lrdSchemeName} onChange={(e) => setLrdSchemeName(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Document List</label>
                                  <input type="text" placeholder="Enter dastavej" value={lrdDastavej} onChange={(e) => setLrdDastavej(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                              </>
                            )}

                            {propertyLoanCategory === "NA Plot" && (
                              <>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property of Location</label>
                                  <input type="text" placeholder="Enter location" value={naPlotLocation} onChange={(e) => setNaPlotLocation(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Property Market Value</label>
                                  <input type="number" placeholder="Enter M.V" value={naPlotMV} onChange={(e) => setNaPlotMV(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" min="0" />
                                </div>
                                <div className="hidden">
                                    <input type="checkbox" id="naPlotYesNoModal" checked={naPlotYesNo} onChange={(e) => setNaPlotYesNo(e.target.checked)} />
                                  </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Document List</label>
                                  <input type="text" placeholder="Enter dastavej" value={naPlotDastavej} onChange={(e) => setNaPlotDastavej(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">VAR</label>
                                  <input type="text" placeholder="Enter VAR" value={naPlotVAR} onChange={(e) => setNaPlotVAR(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Scheme Name</label>
                                  <input type="text" placeholder="Enter scheme" value={naPlotScheme} onChange={(e) => setNaPlotScheme(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                                <div className="hidden">
                                    <input type="text" value={naPlotLavani} onChange={(e) => setNaPlotLavani(e.target.value)} />
                                  </div>
                                <div>
                                    <label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Plot Vacant</label>
                                    <div className="flex items-center gap-4 mt-2">
                                      <button
                                        type="button"
                                        onClick={() => setNaPlotVacant(true)}
                                        className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                                          naPlotVacant === true
                                            ? "border-[#162335] bg-[#162335]/5 text-[#162335]"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                      >
                                        Yes
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                          naPlotVacant === true
                                            ? "border-[#162335] bg-[#162335]"
                                            : "border-slate-300"
                                        }`}>
                                          {naPlotVacant === true && <CheckCircle size={14} className="text-white" />}
                                        </div>
                                      </button>
                                      
                                      <button
                                        type="button"
                                        onClick={() => setNaPlotVacant(false)}
                                        className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                                          naPlotVacant === false
                                            ? "border-[#162335] bg-[#162335]/5 text-[#162335]"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                      >
                                        No
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                          naPlotVacant === false
                                            ? "border-[#162335] bg-[#162335]"
                                            : "border-slate-300"
                                        }`}>
                                          {naPlotVacant === false && <CheckCircle size={14} className="text-white" />}
                                        </div>
                                      </button>
                                    </div>
                                  </div>
                              </>
                            )}
                          </div>
                          <h4 className="text-base font-black text-[#162335] border-b pb-3 border-slate-100">Property Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Loan Type</label>
                              <select value={propertyLoanType} onChange={(e) => setPropertyLoanType(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all">
                                <option value="">Select</option>
                                <option value="Industrial Loan">Industrial</option>
                                <option value="Commercial Loan">Commercial</option>
                                <option value="Residential Loan">Residential</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Type</label>
                              <input type="text" placeholder="e.g. Apartment, Land" value={propertyDetails.propertyType} onChange={e => setPropertyDetails({ ...propertyDetails, propertyType: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Address</label>
                              <input type="text" placeholder="Full address of the property" value={propertyDetails.address} onChange={e => setPropertyDetails({ ...propertyDetails, address: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Estimated Value (₹)</label>
                              <input type="number" placeholder="e.g. 5000000" value={propertyDetails.estimatedValue} onChange={e => setPropertyDetails({ ...propertyDetails, estimatedValue: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Ownership Type</label>
                              <select value={propertyOwnershipType} onChange={e => {
                                setPropertyOwnershipType(e.target.value);
                                if (e.target.value === "Single Owner") setPropertyOwners([propertyOwners[0] || { name: "", contact: "", pan: "", aadhaar: "" }]);
                                else if (e.target.value === "Joint Owner" && propertyOwners.length < 2) setPropertyOwners([...propertyOwners, { name: "", contact: "", pan: "", aadhaar: "" }]);
                              }} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all">
                                <option value="">Select</option>
                                <option value="Single Owner">Single Owner</option>
                                <option value="Joint Owner">Joint Owner</option>
                                <option value="Multiple Owners">Multiple Owners (2)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {propertyOwnershipType && (
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <h4 className="text-base font-black text-[#162335] border-b pb-3 border-slate-100 flex justify-between items-center">
                              <span>Property Owners</span>
                              {propertyOwnershipType === "Multiple Owners" && (
                                <button type="button" onClick={() => addArrayItem(setPropertyOwners, { name: "", contact: "", pan: "", aadhaar: "" })} className="text-xs bg-[#162335] text-white px-3 py-1 rounded-lg">Add Owner</button>
                              )}
                            </h4>
                            {propertyOwners.map((owner, index) => (
                              <div key={index} className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
                                {propertyOwnershipType === "Multiple Owners" && index > 1 && (
                                  <button type="button" onClick={() => removeArrayItem(setPropertyOwners, index)} className="absolute top-3 right-3 text-rose-500 hover:text-rose-600"><X size={16} /></button>
                                )}
                                <h5 className="text-[13px] font-bold text-slate-700">Owner {index + 1}</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <input type="text" placeholder="Full Name" value={owner.name} onChange={e => updateArrayItem(setPropertyOwners, index, 'name', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 transition-all" />
                                  <input type="text" placeholder="Contact Number" value={owner.contact} onChange={e => updateArrayItem(setPropertyOwners, index, 'contact', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 transition-all" />
                                  <input type="text" placeholder="PAN" value={owner.pan} onChange={e => updateArrayItem(setPropertyOwners, index, 'pan', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none uppercase focus:ring-2 focus:ring-[#162335]/20 transition-all" />
                                  <input type="text" placeholder="Aadhaar" value={owner.aadhaar} onChange={e => updateArrayItem(setPropertyOwners, index, 'aadhaar', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 transition-all" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* BUSINESS LOAN UI */}
                    {loanType === "Business Loan" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-6 overflow-hidden">

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                          <h4 className="text-base font-black text-[#162335] border-b pb-3 mb-4 border-slate-100">Business Loan Requirement</h4>
                          <div className="mb-4">
                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Business Loan Type</label>
                            <select value={businessLoanType} onChange={(e) => setBusinessLoanType(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all">
                              <option value="">Select Category</option>
                              <option value="CGTMS">CGTMS</option>
                              <option value="MSME">MSME</option>
                              <option value="Unsecured">Unsecured</option>
                            </select>
                          </div>
                          <h4 className="text-base font-black text-[#162335] border-b pb-3 border-slate-100">Business Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Business Type</label>
                              <select value={businessType} onChange={e => setBusinessType(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all">
                                <option value="">Select</option>
                                <option value="Proprietor">Proprietor</option>
                                <option value="Partnership">Partnership</option>
                                <option value="Company">Company / Pvt Ltd</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Business Name</label>
                              <input type="text" placeholder="e.g. Apex Corp" value={businessDetails.name} onChange={e => setBusinessDetails({ ...businessDetails, name: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Nature of Business</label>
                              <input type="text" placeholder="e.g. Manufacturing, Retail" value={businessDetails.type} onChange={e => setBusinessDetails({ ...businessDetails, type: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Annual Turnover (₹)</label>
                              <input type="number" placeholder="e.g. 10000000" value={businessDetails.turnover} onChange={e => setBusinessDetails({ ...businessDetails, turnover: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Vintage (Years)</label>
                              <input type="number" placeholder="e.g. 5" value={businessDetails.vintage} onChange={e => setBusinessDetails({ ...businessDetails, vintage: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                            </div>
                          </div>
                        </div>

                        {businessType === "Proprietor" && (
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <h4 className="text-base font-black text-[#162335] border-b pb-3 border-slate-100">Proprietor Details</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <input type="text" placeholder="Full Name" value={proprietorDetails.name} onChange={e => setProprietorDetails({ ...proprietorDetails, name: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                              <input type="text" placeholder="PAN" value={proprietorDetails.pan} onChange={e => setProprietorDetails({ ...proprietorDetails, pan: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none uppercase focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                              <input type="text" placeholder="Aadhaar" value={proprietorDetails.aadhaar} onChange={e => setProprietorDetails({ ...proprietorDetails, aadhaar: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                            </div>
                          </div>
                        )}

                        {businessType === "Partnership" && (
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <h4 className="text-base font-black text-[#162335] border-b pb-3 border-slate-100 flex justify-between items-center">
                              <span>Partners</span>
                              <button type="button" onClick={() => addArrayItem(setPartners, { name: "", pan: "", aadhaar: "", share: "" })} className="text-xs bg-[#162335] text-white px-3 py-1 rounded-lg">Add Partner</button>
                            </h4>
                            {partners.map((partner, index) => (
                              <div key={index} className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
                                {index > 0 && <button type="button" onClick={() => removeArrayItem(setPartners, index)} className="absolute top-3 right-3 text-rose-500 hover:text-rose-600"><X size={16} /></button>}
                                <h5 className="text-[13px] font-bold text-slate-700">Partner {index + 1}</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <input type="text" placeholder="Full Name" value={partner.name} onChange={e => updateArrayItem(setPartners, index, 'name', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 transition-all" />
                                  <input type="text" placeholder="Share (%)" value={partner.share} onChange={e => updateArrayItem(setPartners, index, 'share', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 transition-all" />
                                  <input type="text" placeholder="PAN" value={partner.pan} onChange={e => updateArrayItem(setPartners, index, 'pan', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none uppercase focus:ring-2 focus:ring-[#162335]/20 transition-all" />
                                  <input type="text" placeholder="Aadhaar" value={partner.aadhaar} onChange={e => updateArrayItem(setPartners, index, 'aadhaar', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 transition-all" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {businessType === "Company" && (
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <h4 className="text-base font-black text-[#162335] border-b pb-3 border-slate-100 flex justify-between items-center">
                              <span>Directors</span>
                              <button type="button" onClick={() => addArrayItem(setDirectors, { name: "", pan: "", aadhaar: "", din: "" })} className="text-xs bg-[#162335] text-white px-3 py-1 rounded-lg">Add Director</button>
                            </h4>
                            {directors.map((director, index) => (
                              <div key={index} className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
                                {index > 0 && <button type="button" onClick={() => removeArrayItem(setDirectors, index)} className="absolute top-3 right-3 text-rose-500 hover:text-rose-600"><X size={16} /></button>}
                                <h5 className="text-[13px] font-bold text-slate-700">Director {index + 1}</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <input type="text" placeholder="Full Name" value={director.name} onChange={e => updateArrayItem(setDirectors, index, 'name', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 transition-all" />
                                  <input type="text" placeholder="DIN (Optional)" value={director.din} onChange={e => updateArrayItem(setDirectors, index, 'din', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 transition-all" />
                                  <input type="text" placeholder="PAN" value={director.pan} onChange={e => updateArrayItem(setDirectors, index, 'pan', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none uppercase focus:ring-2 focus:ring-[#162335]/20 transition-all" />
                                  <input type="text" placeholder="Aadhaar" value={director.aadhaar} onChange={e => updateArrayItem(setDirectors, index, 'aadhaar', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 transition-all" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>                 {!loanType && (
                    <div className="flex items-center gap-2 text-rose-500 text-xs font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">
                      <AlertCircle size={14} />
                      Please select a loan type to proceed to the next step.
                    </div>
                  )}
                </div>
              </motion.div>
            ) : currentStep === 2 ? (
              /* Step 2: Client Meeting Visit & Representative Verification */
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Header Banner */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-[#162335]">
                  <h2 className="text-base sm:text-lg font-black text-[#162335] flex items-center gap-2">
                    <span className="bg-[#162335]/5 text-[#162335] w-6 h-6 rounded-md flex items-center justify-center text-xs">2</span>
                    Client Visit & Meeting Representative
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Enter the representative or officer details who went to the client and conducted the meeting.
                  </p>
                </div>

                {/* Meeting Context Card */}
                {selectedMeeting && (
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Client & Meeting Details</span>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 uppercase tracking-wider">
                        {selectedMeeting.type || "Consultation"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs pt-1">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Client Name</p>
                        <p className="font-black text-[#162335] text-sm mt-0.5">{selectedMeeting.customerName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contact Number</p>
                        <p className="font-semibold text-slate-700 mt-0.5">{selectedMeeting.customerPhone || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Schedule</p>
                        <p className="font-semibold text-slate-700 mt-0.5">
                          {selectedMeeting.date ? new Date(selectedMeeting.date).toLocaleDateString("en-IN") : "N/A"} at {selectedMeeting.time || "N/A"}
                        </p>
                      </div>
                      {selectedMeeting.location && (
                        <div className="sm:col-span-2 md:col-span-3">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Location</p>
                          <p className="font-medium text-slate-700 mt-0.5">{selectedMeeting.location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Two Names Section: 1) Created By (Employee Name from Leads), 2) Person Name (Who Met The Client - Manual) */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-black text-[#162335] flex items-center gap-2">
                      <User size={18} className="text-[#162335]" />
                      Meeting & Representative Details
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Lead creator is automatically fetched from the lead, while the person who went to meet the client is entered manually by the manager.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 1. Lead Created By (Employee Name - Auto Fetched from Leads) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                          Lead Created By (Employee Name)
                        </label>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                          Auto-Fetched
                        </span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-600">
                          <User size={18} />
                        </div>
                        <input
                          type="text"
                          readOnly
                          value={leadCreatorEmployeeName}
                          className="w-full bg-slate-100/80 border border-slate-200 text-sm font-black text-[#162335] rounded-xl pl-11 pr-4 py-3 outline-none cursor-not-allowed select-none shadow-2xs"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-1.5 flex items-center gap-1">
                        Fetched from Lead creator record {leadCreatorEmpId ? `[ID: ${leadCreatorEmpId}]` : ""}.
                      </p>
                    </div>

                    {/* 2. Person Name (Who Met The Client - Entered Manually by Manager) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                          Pattern Name (Who Met Client) <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Enter Manually
                        </span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                          <User size={18} />
                        </div>
                        <input
                          type="text"
                          value={meetingPersonName}
                          onChange={(e) => setMeetingPersonName(e.target.value)}
                          placeholder="Enter person name who met the client..."
                          className="w-full bg-white border-2 border-emerald-500/40 focus:border-emerald-600 text-sm font-bold text-[#162335] rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-2xs"
                          required
                          autoFocus
                        />
                      </div>
                      {!meetingPersonName.trim() ? (
                        <p className="text-[11px] text-amber-600 font-semibold mt-1.5 flex items-center gap-1">
                          <AlertCircle size={12} /> Person name is required before submitting the form.
                        </p>
                      ) : (
                        <p className="text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                          <CheckCircle size={12} /> Representative verified for visit.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Optional Visit Remarks / Notes */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                      Visit Remarks / Discussion Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={meetingPersonNotes}
                      onChange={(e) => setMeetingPersonNotes(e.target.value)}
                      placeholder="Add any key notes, client feedback, or loan requirement discussion points..."
                      className="w-full bg-slate-50/70 border border-slate-200 text-sm font-medium text-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all resize-none shadow-2xs"
                    />
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Form Footer */}
        {!isSubmitted && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-white shrink-0">
            {/* Back Button */}
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <div /> // Spacer
            )}

            {/* Next / Submit Button */}
            {currentStep === 1 ? (
              <button
                type="button"
                disabled={!isStep1Valid()}
                onClick={() => setCurrentStep(2)}
                className="bg-[#162335] hover:bg-[#162335]/90 text-[#9ca3af] px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <div className="flex flex-col gap-2 items-end">
                {submitError && (
                  <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl w-full text-center">
                    {submitError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  disabled={!isStep2Valid() || isSubmitting}
                  className="bg-[#162335] hover:bg-[#162335]/90 text-[#9ca3af] px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      Submit Form <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

      </motion.div>

      {/* Mobile Camera vs Files Bottom Sheet / Action Modal */}
      <AnimatePresence>
        {showMobileSourceSelector && (
          <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
            {/* Dark sheet background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSourceSelector(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            {/* Sheet contents */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl w-full z-50 p-6 flex flex-col space-y-6 pb-8"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-black text-base text-[#162335]">
                  Select Upload Source
                </h4>
                <button
                  onClick={() => setShowMobileSourceSelector(false)}
                  className="text-slate-400 p-1 hover:bg-slate-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 pt-2">
                <button
                  type="button"
                  onClick={() => handleMobileSourceChoice("camera")}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-[#162335] flex flex-col items-center justify-center gap-2 bg-slate-50 transition active:bg-[#162335]/5"
                >
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center border border-purple-100">
                    <Camera size={22} />
                  </div>
                  <span className="text-xs font-black text-[#162335]">Camera</span>
                  <span className="text-[10px] text-slate-400 font-bold">Use device camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMobileSourceChoice("files")}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-[#162335] flex flex-col items-center justify-center gap-2 bg-slate-50 transition active:bg-[#162335]/5"
                >
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100">
                    <FolderOpen size={22} />
                  </div>
                  <span className="text-xs font-black text-[#162335]">Files</span>
                  <span className="text-[10px] text-slate-400 font-bold">PDF, JPEG, PNG</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
