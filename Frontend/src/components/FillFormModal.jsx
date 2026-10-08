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
  const [unsoldUnit, setUnsoldUnit] = useState("");
  const [unsoldMV, setUnsoldMV] = useState("");
  const [unsoldYesNo, setUnsoldYesNo] = useState(false);
  const [unsoldBV, setUnsoldBV] = useState("");
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
  const [btYear, setBtYear] = useState("");
  const [btAmount, setBtAmount] = useState("");
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
  const [eligibility, setEligibility] = useState({
    age: "",
    income: "",
    employmentType: "",
    companyName: "",
    govDepartment: "",
    businessName: "",
    annualTurnover: "",
    gstNumber: ""
  });
  const [cibilScore, setCibilScore] = useState("");

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
    if (loanType === "Business Loan") return !!businessLoanType && !!businessType;
    if (loanType === "Property Loan") {
      if (!propertyLoanCategory) return false;
      if (["Working Capital", "Plot Loan", "Lease Rental Discounting"].includes(propertyLoanCategory) && (!propertyLocation || !durationOfRentProperty)) return false;
      if (propertyLoanCategory === "LAP" && (!lapPropertyType || !lapPropertyLocation || !lapPropertyMarketValue)) return false;
      if (propertyLoanCategory === "Unsold" && (!unsoldUnit || !unsoldMV || !unsoldBV || !unsoldScheme || !unsoldLocation || !unsoldFloor || !unsoldDastavej || !unsoldPartnership)) return false;
      if (propertyLoanCategory === "LRD" && (!lrdRent || !lrdMarketValue || !lrdLocation || !lrdLoiYear || !lrdSchemeName || !lrdDastavej)) return false;
      if (propertyLoanCategory === "NA Plot" && (!naPlotLocation || !naPlotMV || !naPlotDastavej || !naPlotVAR || !naPlotScheme || !naPlotLavani)) return false;
      return !!propertyLoanType;
    }
    if (loanType === "Balance Transfer") {
      return !!btBankName && !!btRateOfInterest && !!btPropertyType && !!btMarketValue && !!btLocation && !!btYear && !!btAmount && !!btOutstanding && !!btForeclosureCharge;
    }
    return true;
  };

  // Step 2 Validation
  const isStep2Valid = () => {
    const ageNum = parseInt(eligibility.age, 10);
    const incomeNum = parseFloat(eligibility.income);
    const cibilNum = parseInt(cibilScore, 10);

    const isAgeValid = !isNaN(ageNum) && ageNum >= 18 && ageNum <= 60;
    const isIncomeValid = !isNaN(incomeNum) && incomeNum > 0;
    const isCibilValid = !isNaN(cibilNum) && cibilNum >= 700 && cibilNum <= 900;

    let isEmploymentValid = false;
    if (eligibility.employmentType === "Private") {
      isEmploymentValid = eligibility.companyName.trim().length > 0;
    } else if (eligibility.employmentType === "Government") {
      isEmploymentValid = eligibility.govDepartment.trim().length > 0;
    } else if (eligibility.employmentType === "Business") {
      const turnoverNum = parseFloat(eligibility.annualTurnover);
      const isTurnoverValid = !isNaN(turnoverNum) && turnoverNum > 0;
      const isGstValid = eligibility.gstNumber.trim().length > 0;
      isEmploymentValid = eligibility.businessName.trim().length > 0 && isTurnoverValid && isGstValid;
    }

    return isAgeValid && isIncomeValid && isCibilValid && isEmploymentValid;
  };

  // Get active documents list (based on loanType)
  const getActiveDocuments = () => {
    if (!loanType || !LOAN_DOCUMENTS_MAPPING[loanType]) {
      return [];
    }
    return LOAN_DOCUMENTS_MAPPING[loanType].map(docId => ALL_DOCUMENTS[docId]);
  };

  // Step 3 Validation
  const isStep3Valid = () => {
    return true; // Document collection section removed
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

  const handleEligibilityChange = (e) => {
    const { name, value } = e.target;
    setEligibility(prev => ({ ...prev, [name]: value }));
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
    if (!isStep1Valid() || !isStep2Valid() || !isStep3Valid()) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const formData = new FormData();

      // ── Meeting reference ────────────────────────────────────────────────
      if (selectedMeeting?._id) formData.append("meetingId", selectedMeeting._id);
      if (selectedMeeting?.customerName) formData.append("customerName", selectedMeeting.customerName);
      if (selectedMeeting?.customerPhone) formData.append("customerPhone", selectedMeeting.customerPhone);

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
      if (unsoldUnit) formData.append("unsoldUnit", unsoldUnit);
      if (unsoldMV) formData.append("unsoldMV", unsoldMV);
      formData.append("unsoldYesNo", unsoldYesNo);
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
      if (btBankName) formData.append("btBankName", btBankName);
      if (btRateOfInterest) formData.append("btRateOfInterest", btRateOfInterest);
      if (btPropertyType) formData.append("btPropertyType", btPropertyType);
      if (btMarketValue) formData.append("btMarketValue", btMarketValue);
      if (btLocation) formData.append("btLocation", btLocation);
      if (btYear) formData.append("btYear", btYear);
      if (btAmount) formData.append("btAmount", btAmount);
      if (btOutstanding) formData.append("btOutstanding", btOutstanding);
      if (btForeclosureCharge) formData.append("btForeclosureCharge", btForeclosureCharge);
      if (propertyLoanType) formData.append("propertyLoanType", propertyLoanType);

      // ── Step 2: Eligibility ───────────────────────────────────────────────
      formData.append("cibilScore", cibilScore);
      formData.append("eligibility_age", eligibility.age);
      formData.append("eligibility_income", eligibility.income);
      formData.append("eligibility_employmentType", eligibility.employmentType);
      formData.append("eligibility_companyName", eligibility.companyName);
      formData.append("eligibility_govDepartment", eligibility.govDepartment);
      formData.append("eligibility_businessName", eligibility.businessName);
      formData.append("eligibility_annualTurnover", eligibility.annualTurnover);
      formData.append("eligibility_gstNumber", eligibility.gstNumber);

      // ── Step 3: Documents (append raw File objects) ───────────────────────
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
    setEligibility({
      age: "",
      income: "",
      employmentType: "",
      companyName: "",
      govDepartment: "",
      businessName: "",
      annualTurnover: "",
      gstNumber: ""
    });
    setCibilScore("");
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
            <div className="bg-[#0a2540] p-1.5 rounded-lg text-[#d4af37]">
              <FileText size={18} />
            </div>
            <h3 className="font-black text-[#0a2540] text-base sm:text-lg">
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
                <div className={`flex items-center gap-2.5 ${currentStep >= 1 ? "text-[#0a2540]" : "text-slate-400"}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${currentStep === 1
                    ? "bg-[#0a2540] text-[#d4af37] ring-4 ring-[#0a2540]/10"
                    : currentStep > 1
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}>
                    {currentStep > 1 ? "✓" : "01"}
                  </span>
                  <span className={`text-xs uppercase tracking-wider font-extrabold ${currentStep === 1 ? "text-[#0a2540]" : "text-slate-500"}`}>
                    Loan Requirement
                  </span>
                </div>
                <div className="flex-1 max-w-[60px] h-[2px] bg-slate-200 mx-2" />
                <div className={`flex items-center gap-2.5 ${currentStep >= 2 ? "text-[#0a2540]" : "text-slate-400"}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${currentStep === 2
                    ? "bg-[#0a2540] text-[#d4af37] ring-4 ring-[#0a2540]/10"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}>
                    02
                  </span>
                  <span className={`text-xs uppercase tracking-wider font-extrabold ${currentStep === 2 ? "text-[#0a2540]" : "text-slate-500"}`}>
                    Eligibility Check
                  </span>
                </div>
              </div>

              {/* Mobile Stepper Indicator */}
              <div className="md:hidden flex items-center justify-between">
                <span className="text-xs font-black text-[#0a2540] uppercase tracking-wider">
                  Step {currentStep} of 2: {
                    currentStep === 1 ? "Loan Requirement" : "Eligibility Check"
                  }
                </span>
                <span className="text-xs font-black text-[#0a2540] bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {Math.round((currentStep / 2) * 100)}%
                </span>
              </div>
              <div className="md:hidden mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#0a2540] h-full transition-all duration-300"
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
                <h2 className="text-xl sm:text-2xl font-black text-[#0a2540] mb-2">
                  Form Submitted Successfully
                </h2>
                <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
                  The customer loan form and required documents have been successfully submitted.
                </p>

                {/* Summary Box */}
                <div className="w-full text-left bg-slate-50 border border-slate-200 p-4 rounded-2xl mb-6">
                  <h4 className="text-xs font-black text-[#0a2540] uppercase tracking-wider mb-2 pb-1.5 border-b border-slate-200">
                    Application Summary
                  </h4>
                  <div className="space-y-1 text-xs">
                    <p className="flex justify-between"><span className="text-slate-400">Loan Type:</span> <strong className="text-[#0a2540]">{loanType}</strong></p>
                    <p className="flex justify-between"><span className="text-slate-400">Age / CIBIL:</span> <strong className="text-[#0a2540]">{eligibility.age} yrs / {cibilScore}</strong></p>
                    <p className="flex justify-between"><span className="text-slate-400">Employment:</span> <strong className="text-[#0a2540]">{eligibility.employmentType}</strong></p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full bg-[#0a2540] hover:bg-[#0a2540]/90 text-[#d4af37] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition shadow-sm"
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
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-[#0a2540]">
                  <h2 className="text-base sm:text-lg font-black text-[#0a2540] flex items-center gap-2">
                    <span className="bg-[#0a2540]/5 text-[#0a2540] w-6 h-6 rounded-md flex items-center justify-center text-xs">1</span>
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
                            ? "border-[#0a2540] bg-[#0a2540]/5 ring-2 ring-[#0a2540]/10"
                            : "border-slate-200 hover:border-[#0a2540]/30"
                            }`}
                        >
                          <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? "bg-[#0a2540] text-[#d4af37]" : "bg-slate-100 text-slate-600"
                            }`}>
                            <IconComp size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-[#0a2540]">{type.title}</h4>
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
                          <h4 className="text-base font-black text-[#0a2540] border-b pb-3 border-slate-100">Property Purchase Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                            <div className="md:col-span-2">
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Type of Category *</label>
                              <select value={propertyPurchaseCategory} onChange={(e) => setPropertyPurchaseCategory(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all">
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
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Location *</label>
                                  <input type="text" placeholder="Enter location" value={ppLocation} onChange={(e) => setPpLocation(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Market Rate *</label>
                                  <input type="number" placeholder="Enter market rate" value={ppMarketRate} onChange={(e) => setPpMarketRate(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" min="0" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Dastavej Rate *</label>
                                  <input type="number" placeholder="Enter dastavej rate" value={ppDastavejRate} onChange={(e) => setPpDastavejRate(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" min="0" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Dastavej Name *</label>
                                  <input type="text" placeholder="Enter dastavej name" value={ppDastavejName} onChange={(e) => setPpDastavejName(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* BALANCE TRANSFER UI */}
                    {loanType === "Balance Transfer" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-6 overflow-hidden">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                          <h4 className="text-base font-black text-[#0a2540] border-b pb-3 border-slate-100">Balance Transfer Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Bank Name *</label>
                              <input type="text" placeholder="Enter bank name" value={btBankName} onChange={(e) => setBtBankName(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Rate of Interest (%) *</label>
                              <input type="number" step="0.01" placeholder="e.g. 8.5" value={btRateOfInterest} onChange={(e) => setBtRateOfInterest(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Type *</label>
                              <input type="text" placeholder="Enter property type" value={btPropertyType} onChange={(e) => setBtPropertyType(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Market Value *</label>
                              <input type="number" placeholder="Enter market value" value={btMarketValue} onChange={(e) => setBtMarketValue(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Location *</label>
                              <input type="text" placeholder="Enter Location" value={btLocation} onChange={(e) => setBtLocation(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Year *</label>
                              <select value={btYear} onChange={(e) => setBtYear(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all">
                                <option value="">Select Year</option>
                                <option value="T1">T1</option>
                                <option value="T2">T2</option>
                                <option value="T3">T3</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Amount *</label>
                              <input type="number" placeholder="Enter amount" value={btAmount} onChange={(e) => setBtAmount(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Outstanding *</label>
                              <input type="number" placeholder="Enter outstanding" value={btOutstanding} onChange={(e) => setBtOutstanding(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Foreclosure Charge *</label>
                              <input type="number" placeholder="Enter foreclosure charge" value={btForeclosureCharge} onChange={(e) => setBtForeclosureCharge(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* PROPERTY LOAN UI */}
                    {loanType === "Property Loan" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-6 overflow-hidden">

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                          <h4 className="text-base font-black text-[#0a2540] border-b pb-3 mb-4 border-slate-100">Property Loan Requirement</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-4">
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Loan Category *</label>
                              <select value={propertyLoanCategory} onChange={(e) => setPropertyLoanCategory(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all">
                                <option value="">Select Category</option>
                                <option value="Working Capital">Working Capital</option>
                                <option value="Plot Loan">Plot Loan</option>
                                <option value="Lease Rental Discounting">Lease Rental Discounting</option>
                                <option value="LAP">LAP</option>
                                <option value="Unsold">Unsold</option>
                                <option value="LRD">LRD</option>
                                <option value="NA Plot">NA Plot</option>
                              </select>
                            </div>
                            
                            {propertyLoanCategory && ["Working Capital", "Plot Loan", "Lease Rental Discounting"].includes(propertyLoanCategory) && (
                              <>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Location *</label>
                                  <input type="text" placeholder="Enter location" value={propertyLocation} onChange={(e) => setPropertyLocation(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Duration of Rent Property *</label>
                                  <input type="text" placeholder="e.g. 5 Years" value={durationOfRentProperty} onChange={(e) => setDurationOfRentProperty(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                              </>
                            )}

                            {propertyLoanCategory === "LAP" && (
                              <>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Type *</label>
                                  <select value={lapPropertyType} onChange={(e) => setLapPropertyType(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all">
                                    <option value="">Select Property Type</option>
                                    <option value="Commercial">Commercial</option>
                                    <option value="Residential">Residential</option>
                                    <option value="Industrial">Industrial</option>
                                  </select>
                                </div>
                                {lapPropertyType && (
                                  <>
                                    <div>
                                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Location *</label>
                                      <input type="text" placeholder="Enter location" value={lapPropertyLocation} onChange={(e) => setLapPropertyLocation(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                    </div>
                                    <div>
                                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Market Value *</label>
                                      <input type="number" placeholder="Enter market value" value={lapPropertyMarketValue} onChange={(e) => setLapPropertyMarketValue(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                    </div>
                                  </>
                                )}
                              </>
                            )}

                            {propertyLoanCategory === "Unsold" && (
                              <>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Unit *</label>
                                  <input type="text" placeholder="Enter unit" value={unsoldUnit} onChange={(e) => setUnsoldUnit(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">M.V *</label>
                                  <input type="number" placeholder="Enter M.V" value={unsoldMV} onChange={(e) => setUnsoldMV(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" min="0" />
                                </div>
                                <div className="flex items-center gap-2 mt-7">
                                  <input type="checkbox" id="unsoldYesNoModal" checked={unsoldYesNo} onChange={(e) => setUnsoldYesNo(e.target.checked)} className="w-4 h-4 text-[#0a2540] bg-slate-100 border-slate-300 rounded focus:ring-[#0a2540] focus:ring-2" />
                                  <label htmlFor="unsoldYesNoModal" className="text-[13px] font-semibold text-slate-700">Yes / No</label>
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">B.V *</label>
                                  <input type="number" placeholder="Enter B.V" value={unsoldBV} onChange={(e) => setUnsoldBV(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" min="0" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Scheme *</label>
                                  <input type="text" placeholder="Enter scheme" value={unsoldScheme} onChange={(e) => setUnsoldScheme(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Location *</label>
                                  <input type="text" placeholder="Enter location" value={unsoldLocation} onChange={(e) => setUnsoldLocation(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Floor *</label>
                                  <input type="text" placeholder="Enter floor" value={unsoldFloor} onChange={(e) => setUnsoldFloor(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Dastavej *</label>
                                  <input type="text" placeholder="Enter dastavej" value={unsoldDastavej} onChange={(e) => setUnsoldDastavej(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Partnership *</label>
                                  <input type="text" placeholder="Enter partnership" value={unsoldPartnership} onChange={(e) => setUnsoldPartnership(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                              </>
                            )}

                            {propertyLoanCategory === "LRD" && (
                              <>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Rent *</label>
                                  <input type="number" placeholder="Enter rent" value={lrdRent} onChange={(e) => setLrdRent(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" min="0" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Market Value *</label>
                                  <input type="number" placeholder="Enter market value" value={lrdMarketValue} onChange={(e) => setLrdMarketValue(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" min="0" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Location *</label>
                                  <input type="text" placeholder="Enter location" value={lrdLocation} onChange={(e) => setLrdLocation(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">LOI Year *</label>
                                  <input type="text" placeholder="Enter LOI year" value={lrdLoiYear} onChange={(e) => setLrdLoiYear(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Scheme Name *</label>
                                  <input type="text" placeholder="Enter scheme name" value={lrdSchemeName} onChange={(e) => setLrdSchemeName(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Dastavej *</label>
                                  <input type="text" placeholder="Enter dastavej" value={lrdDastavej} onChange={(e) => setLrdDastavej(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                              </>
                            )}

                            {propertyLoanCategory === "NA Plot" && (
                              <>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Location *</label>
                                  <input type="text" placeholder="Enter location" value={naPlotLocation} onChange={(e) => setNaPlotLocation(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">M.V *</label>
                                  <input type="number" placeholder="Enter M.V" value={naPlotMV} onChange={(e) => setNaPlotMV(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" min="0" />
                                </div>
                                <div className="flex items-center gap-2 mt-7">
                                  <input type="checkbox" id="naPlotYesNoModal" checked={naPlotYesNo} onChange={(e) => setNaPlotYesNo(e.target.checked)} className="w-4 h-4 text-[#0a2540] bg-slate-100 border-slate-300 rounded focus:ring-[#0a2540] focus:ring-2" />
                                  <label htmlFor="naPlotYesNoModal" className="text-[13px] font-semibold text-slate-700">Yes / No</label>
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Dastavej *</label>
                                  <input type="text" placeholder="Enter dastavej" value={naPlotDastavej} onChange={(e) => setNaPlotDastavej(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">VAR *</label>
                                  <input type="text" placeholder="Enter VAR" value={naPlotVAR} onChange={(e) => setNaPlotVAR(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Scheme *</label>
                                  <input type="text" placeholder="Enter scheme" value={naPlotScheme} onChange={(e) => setNaPlotScheme(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Lavani *</label>
                                  <input type="text" placeholder="Enter lavani" value={naPlotLavani} onChange={(e) => setNaPlotLavani(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                                </div>
                                <div className="flex items-center gap-2 mt-7">
                                  <input type="checkbox" id="naPlotVacantModal" checked={naPlotVacant} onChange={(e) => setNaPlotVacant(e.target.checked)} className="w-4 h-4 text-[#0a2540] bg-slate-100 border-slate-300 rounded focus:ring-[#0a2540] focus:ring-2" />
                                  <label htmlFor="naPlotVacantModal" className="text-[13px] font-semibold text-slate-700">Plot Vacant — Yes / No</label>
                                </div>
                              </>
                            )}
                          </div>
                          <h4 className="text-base font-black text-[#0a2540] border-b pb-3 border-slate-100">Property Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Loan Type *</label>
                              <select value={propertyLoanType} onChange={(e) => setPropertyLoanType(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all">
                                <option value="">Select</option>
                                <option value="Industrial Loan">Industrial</option>
                                <option value="Commercial Loan">Commercial</option>
                                <option value="Plot Loan">Plot</option>
                                <option value="Residential Loan">Residential</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Type *</label>
                              <input type="text" placeholder="e.g. Apartment, Land" value={propertyDetails.propertyType} onChange={e => setPropertyDetails({ ...propertyDetails, propertyType: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Address *</label>
                              <input type="text" placeholder="Full address of the property" value={propertyDetails.address} onChange={e => setPropertyDetails({ ...propertyDetails, address: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Estimated Value (₹) *</label>
                              <input type="number" placeholder="e.g. 5000000" value={propertyDetails.estimatedValue} onChange={e => setPropertyDetails({ ...propertyDetails, estimatedValue: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Ownership Type *</label>
                              <select value={propertyOwnershipType} onChange={e => {
                                setPropertyOwnershipType(e.target.value);
                                if (e.target.value === "Single Owner") setPropertyOwners([propertyOwners[0] || { name: "", contact: "", pan: "", aadhaar: "" }]);
                                else if (e.target.value === "Joint Owner" && propertyOwners.length < 2) setPropertyOwners([...propertyOwners, { name: "", contact: "", pan: "", aadhaar: "" }]);
                              }} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all">
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
                            <h4 className="text-base font-black text-[#0a2540] border-b pb-3 border-slate-100 flex justify-between items-center">
                              <span>Property Owners</span>
                              {propertyOwnershipType === "Multiple Owners" && (
                                <button type="button" onClick={() => addArrayItem(setPropertyOwners, { name: "", contact: "", pan: "", aadhaar: "" })} className="text-xs bg-[#0a2540] text-[#d4af37] px-3 py-1 rounded-lg">Add Owner</button>
                              )}
                            </h4>
                            {propertyOwners.map((owner, index) => (
                              <div key={index} className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
                                {propertyOwnershipType === "Multiple Owners" && index > 1 && (
                                  <button type="button" onClick={() => removeArrayItem(setPropertyOwners, index)} className="absolute top-3 right-3 text-rose-500 hover:text-rose-600"><X size={16} /></button>
                                )}
                                <h5 className="text-[13px] font-bold text-slate-700">Owner {index + 1}</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <input type="text" placeholder="Full Name *" value={owner.name} onChange={e => updateArrayItem(setPropertyOwners, index, 'name', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 transition-all" />
                                  <input type="text" placeholder="Contact Number *" value={owner.contact} onChange={e => updateArrayItem(setPropertyOwners, index, 'contact', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 transition-all" />
                                  <input type="text" placeholder="PAN *" value={owner.pan} onChange={e => updateArrayItem(setPropertyOwners, index, 'pan', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none uppercase focus:ring-2 focus:ring-[#0a2540]/20 transition-all" />
                                  <input type="text" placeholder="Aadhaar *" value={owner.aadhaar} onChange={e => updateArrayItem(setPropertyOwners, index, 'aadhaar', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 transition-all" />
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
                          <h4 className="text-base font-black text-[#0a2540] border-b pb-3 mb-4 border-slate-100">Business Loan Requirement</h4>
                          <div className="mb-4">
                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Business Loan Type *</label>
                            <select value={businessLoanType} onChange={(e) => setBusinessLoanType(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all">
                              <option value="">Select Category</option>
                              <option value="CGTMS">CGTMS</option>
                              <option value="MSME">MSME</option>
                              <option value="Unsecured">Unsecured</option>
                            </select>
                          </div>
                          <h4 className="text-base font-black text-[#0a2540] border-b pb-3 border-slate-100">Business Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Business Type *</label>
                              <select value={businessType} onChange={e => setBusinessType(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all">
                                <option value="">Select</option>
                                <option value="Proprietor">Proprietor</option>
                                <option value="Partnership">Partnership</option>
                                <option value="Company">Company / Pvt Ltd</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Business Name *</label>
                              <input type="text" placeholder="e.g. Apex Corp" value={businessDetails.name} onChange={e => setBusinessDetails({ ...businessDetails, name: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Nature of Business *</label>
                              <input type="text" placeholder="e.g. Manufacturing, Retail" value={businessDetails.type} onChange={e => setBusinessDetails({ ...businessDetails, type: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Annual Turnover (₹) *</label>
                              <input type="number" placeholder="e.g. 10000000" value={businessDetails.turnover} onChange={e => setBusinessDetails({ ...businessDetails, turnover: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                            </div>
                            <div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Vintage (Years) *</label>
                              <input type="number" placeholder="e.g. 5" value={businessDetails.vintage} onChange={e => setBusinessDetails({ ...businessDetails, vintage: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                            </div>
                          </div>
                        </div>

                        {businessType === "Proprietor" && (
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <h4 className="text-base font-black text-[#0a2540] border-b pb-3 border-slate-100">Proprietor Details</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <input type="text" placeholder="Full Name *" value={proprietorDetails.name} onChange={e => setProprietorDetails({ ...proprietorDetails, name: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                              <input type="text" placeholder="PAN *" value={proprietorDetails.pan} onChange={e => setProprietorDetails({ ...proprietorDetails, pan: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none uppercase focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                              <input type="text" placeholder="Aadhaar *" value={proprietorDetails.aadhaar} onChange={e => setProprietorDetails({ ...proprietorDetails, aadhaar: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all" />
                            </div>
                          </div>
                        )}

                        {businessType === "Partnership" && (
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <h4 className="text-base font-black text-[#0a2540] border-b pb-3 border-slate-100 flex justify-between items-center">
                              <span>Partners</span>
                              <button type="button" onClick={() => addArrayItem(setPartners, { name: "", pan: "", aadhaar: "", share: "" })} className="text-xs bg-[#0a2540] text-[#d4af37] px-3 py-1 rounded-lg">Add Partner</button>
                            </h4>
                            {partners.map((partner, index) => (
                              <div key={index} className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
                                {index > 0 && <button type="button" onClick={() => removeArrayItem(setPartners, index)} className="absolute top-3 right-3 text-rose-500 hover:text-rose-600"><X size={16} /></button>}
                                <h5 className="text-[13px] font-bold text-slate-700">Partner {index + 1}</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <input type="text" placeholder="Full Name *" value={partner.name} onChange={e => updateArrayItem(setPartners, index, 'name', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 transition-all" />
                                  <input type="text" placeholder="Share (%) *" value={partner.share} onChange={e => updateArrayItem(setPartners, index, 'share', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 transition-all" />
                                  <input type="text" placeholder="PAN *" value={partner.pan} onChange={e => updateArrayItem(setPartners, index, 'pan', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none uppercase focus:ring-2 focus:ring-[#0a2540]/20 transition-all" />
                                  <input type="text" placeholder="Aadhaar *" value={partner.aadhaar} onChange={e => updateArrayItem(setPartners, index, 'aadhaar', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 transition-all" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {businessType === "Company" && (
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <h4 className="text-base font-black text-[#0a2540] border-b pb-3 border-slate-100 flex justify-between items-center">
                              <span>Directors</span>
                              <button type="button" onClick={() => addArrayItem(setDirectors, { name: "", pan: "", aadhaar: "", din: "" })} className="text-xs bg-[#0a2540] text-[#d4af37] px-3 py-1 rounded-lg">Add Director</button>
                            </h4>
                            {directors.map((director, index) => (
                              <div key={index} className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
                                {index > 0 && <button type="button" onClick={() => removeArrayItem(setDirectors, index)} className="absolute top-3 right-3 text-rose-500 hover:text-rose-600"><X size={16} /></button>}
                                <h5 className="text-[13px] font-bold text-slate-700">Director {index + 1}</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <input type="text" placeholder="Full Name *" value={director.name} onChange={e => updateArrayItem(setDirectors, index, 'name', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 transition-all" />
                                  <input type="text" placeholder="DIN (Optional)" value={director.din} onChange={e => updateArrayItem(setDirectors, index, 'din', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 transition-all" />
                                  <input type="text" placeholder="PAN *" value={director.pan} onChange={e => updateArrayItem(setDirectors, index, 'pan', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none uppercase focus:ring-2 focus:ring-[#0a2540]/20 transition-all" />
                                  <input type="text" placeholder="Aadhaar *" value={director.aadhaar} onChange={e => updateArrayItem(setDirectors, index, 'aadhaar', e.target.value)} className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 transition-all" />
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
              /* Step 2: Eligibility Check */
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-[#0a2540]">
                  <h2 className="text-base sm:text-lg font-black text-[#0a2540] flex items-center gap-2">
                    <span className="bg-[#0a2540]/5 text-[#0a2540] w-6 h-6 rounded-md flex items-center justify-center text-xs">2</span>
                    Eligibility Check
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Provide accurate income, age, CIBIL, and occupation criteria to evaluate pre-qualification.
                  </p>
                </div>

                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                    {/* Age Input */}
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                        Age *
                      </label>
                      <input
                        type="number"
                        name="age"
                        required
                        min="18"
                        max="60"
                        value={eligibility.age}
                        onChange={handleEligibilityChange}
                        onKeyDown={(e) => {
                          if (['-', '+', 'e', 'E'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder="e.g. 30"
                        className="w-full hide-spinners bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0a2540]/20"
                      />
                      {eligibility.age && (parseInt(eligibility.age, 10) < 18 || parseInt(eligibility.age, 10) > 60) && (
                        <p className="text-[11px] text-rose-500 font-bold mt-1">Age must be between 18 and 60 years.</p>
                      )}
                    </div>

                    {/* Income Input */}
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                        Income (Annual in INR) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                          ₹
                        </span>
                        <input
                          type="number"
                          name="income"
                          required
                          min="0"
                          value={eligibility.income}
                          onChange={handleEligibilityChange}
                          onKeyDown={(e) => {
                            if (['-', '+', 'e', 'E'].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          placeholder="e.g. 600000"
                          className="w-full hide-spinners bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl pl-8 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0a2540]/20"
                        />
                      </div>
                      {eligibility.income && parseFloat(eligibility.income) <= 0 && (
                        <p className="text-[11px] text-rose-500 font-bold mt-1">Income must be a positive amount.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                    {/* Employment Type */}
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                        Employment Type *
                      </label>
                      <select
                        name="employmentType"
                        required
                        value={eligibility.employmentType}
                        onChange={handleEligibilityChange}
                        className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all"
                      >
                        <option value="">Select Employment Type</option>
                        <option value="Private">Private Sector</option>
                        <option value="Government">Government Sector</option>
                        <option value="Business">Self Employed / Business</option>
                      </select>
                    </div>

                    {/* CIBIL Score */}
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                        CIBIL Score
                      </label>
                      <input
                        type="number"
                        name="cibilScore"
                        required
                        min="700"
                        max="900"
                        value={cibilScore}
                        onChange={(e) => setCibilScore(e.target.value)}
                        onKeyDown={(e) => {
                          if (['-', '+', 'e', 'E'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder="e.g. 750 (700 - 900)"
                        className="w-full hide-spinners bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0a2540]/20"
                      />
                      {cibilScore && (parseInt(cibilScore, 10) < 700 || parseInt(cibilScore, 10) > 900) && (
                        <p className="text-[11px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                          <AlertCircle size={10} /> CIBIL Score must be between 700 and 900.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Conditional Fields based on Employment Type */}
                  <AnimatePresence mode="wait">
                    {eligibility.employmentType === "Private" && (
                      <motion.div
                        key="private-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-100 pt-4 mt-2"
                      >
                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          name="companyName"
                          required
                          value={eligibility.companyName}
                          onChange={handleEligibilityChange}
                          placeholder="e.g. Acme Corp Pvt Ltd"
                          className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all"
                        />
                      </motion.div>
                    )}

                    {eligibility.employmentType === "Government" && (
                      <motion.div
                        key="gov-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-100 pt-4 mt-2"
                      >
                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                          Government Department / Agency *
                        </label>
                        <input
                          type="text"
                          name="govDepartment"
                          required
                          value={eligibility.govDepartment}
                          onChange={handleEligibilityChange}
                          placeholder="e.g. Ministry of Railways"
                          className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all"
                        />
                      </motion.div>
                    )}

                    {eligibility.employmentType === "Business" && (
                      <motion.div
                        key="business-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-100 pt-4 mt-2 space-y-6"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                          <div>
                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                              Business Name *
                            </label>
                            <input
                              type="text"
                              name="businessName"
                              required
                              value={eligibility.businessName}
                              onChange={handleEligibilityChange}
                              placeholder="e.g. Apex Enterprises"
                              className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                              Annual Turnover (INR) *
                            </label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                                ₹
                              </span>
                              <input
                                type="number"
                                name="annualTurnover"
                                required
                                min="0"
                                value={eligibility.annualTurnover}
                                onChange={handleEligibilityChange}
                                onKeyDown={(e) => {
                                  if (['-', '+', 'e', 'E'].includes(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                                placeholder="e.g. 1500000"
                                className="w-full hide-spinners bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl pl-8 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0a2540]/20"
                              />
                            </div>
                            {eligibility.annualTurnover && parseFloat(eligibility.annualTurnover) <= 0 && (
                              <p className="text-[11px] text-rose-500 font-bold mt-1">Turnover must be positive.</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                            GST Number *
                          </label>
                          <input
                            type="text"
                            name="gstNumber"
                            required
                            value={eligibility.gstNumber}
                            onChange={handleEligibilityChange}
                            placeholder="e.g. 22AAAAA0000A1Z5"
                            className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white transition-all uppercase"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                className="px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition text-sm flex items-center gap-1.5"
              >
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <div /> // Spacer
            )}

            {/* Next / Submit Button */}
            {currentStep < 2 ? (
              <button
                type="button"
                disabled={currentStep === 1 ? !isStep1Valid() : !isStep2Valid()}
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="bg-[#0a2540] hover:bg-[#0a2540]/90 text-[#d4af37] px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
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
                  className="bg-[#0a2540] hover:bg-[#0a2540]/90 text-[#d4af37] px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition shadow-sm disabled:opacity-50"
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
                <h4 className="font-black text-base text-[#0a2540]">
                  Select Upload Source
                </h4>
                <button
                  onClick={() => setShowMobileSourceSelector(false)}
                  className="text-slate-400 p-1 hover:bg-slate-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-6 pt-2">
                <button
                  type="button"
                  onClick={() => handleMobileSourceChoice("camera")}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-[#0a2540] flex flex-col items-center justify-center gap-2 bg-slate-50 transition active:bg-[#0a2540]/5"
                >
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center border border-purple-100">
                    <Camera size={22} />
                  </div>
                  <span className="text-xs font-black text-[#0a2540]">Camera</span>
                  <span className="text-[10px] text-slate-400 font-bold">Use device camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMobileSourceChoice("files")}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-[#0a2540] flex flex-col items-center justify-center gap-2 bg-slate-50 transition active:bg-[#0a2540]/5"
                >
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100">
                    <FolderOpen size={22} />
                  </div>
                  <span className="text-xs font-black text-[#0a2540]">Files</span>
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
