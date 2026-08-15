import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ChevronRight, ChevronLeft, Upload, Camera, FileText, 
  CheckCircle, AlertCircle, Trash2, Loader2, User, Briefcase, 
  Home, Landmark, ShieldCheck, CreditCard, ArrowRight, RefreshCw, FolderOpen
} from "lucide-react";

const LOAN_TYPES = [
  { id: "Personal Loan", title: "Personal Loan", icon: User, desc: "For personal expenses & cash needs" },
  { id: "Business Loan", title: "Business Loan", icon: Briefcase, desc: "To expand or fund your business" },
  { id: "Home Loan", title: "Home Loan", icon: Home, desc: "For buying or constructing a house" },
  { id: "Property Loan", title: "Property Loan", icon: Landmark, desc: "Unlock value from residential/commercial property" },
  { id: "Insurance", title: "Insurance", icon: ShieldCheck, desc: "Secure your life, health, or assets" },
  { id: "Credit Cards", title: "Credit Cards", icon: CreditCard, desc: "Reward points & short-term credit" }
];

const DOCUMENTS_LIST = [
  { id: "aadhaar", title: "Aadhaar Card", desc: "Front & Back combined PDF/Image", required: true },
  { id: "pan", title: "PAN Card", desc: "Clear front-side scan", required: true },
  { id: "bankStatement", title: "Bank Statements", desc: "Last 6 months PDF statements", required: true },
  { id: "salaryOrItr", title: "Salary Slips or ITR", desc: "Recent 3 salary slips or ITR V", required: true },
  { id: "addressProof", title: "Address Proof", desc: "Electricity bill, rent agreement, etc.", required: true },
  { id: "businessDocs", title: "Business Documents", desc: "GST certificate or trade license", required: false, conditional: true }
];

export default function FillFormModal({ isOpen, onClose, selectedMeeting }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [activeDocId, setActiveDocId] = useState(null);
  const [showMobileSourceSelector, setShowMobileSourceSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form State
  const [loanType, setLoanType] = useState("");
  const [propertyLoanType, setPropertyLoanType] = useState("");
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
    if (loanType === "Property Loan") {
      return !!propertyLoanType;
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

  // Get active documents list (based on conditional Business Documents)
  const getActiveDocuments = () => {
    return DOCUMENTS_LIST.filter(doc => {
      if (doc.conditional) {
        return eligibility.employmentType === "Business";
      }
      return true;
    });
  };

  // Step 3 Validation
  const isStep3Valid = () => {
    const activeDocs = getActiveDocuments();
    return activeDocs.every(doc => !!uploadedFiles[doc.id] && !uploadProgress[doc.id]);
  };

  const handleLoanTypeSelect = (typeId) => {
    setLoanType(typeId);
    if (typeId !== "Property Loan") {
      setPropertyLoanType("");
    }
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

  // Submit Handler
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!isStep1Valid() || !isStep2Valid() || !isStep3Valid()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 2000);
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
    setIsSubmitted(false);
    onClose();
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
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    currentStep === 1 
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
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    currentStep === 2 
                      ? "bg-[#0a2540] text-[#d4af37] ring-4 ring-[#0a2540]/10" 
                      : currentStep > 2 
                        ? "bg-emerald-500 text-white" 
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}>
                    {currentStep > 2 ? "✓" : "02"}
                  </span>
                  <span className={`text-xs uppercase tracking-wider font-extrabold ${currentStep === 2 ? "text-[#0a2540]" : "text-slate-500"}`}>
                    Eligibility Check
                  </span>
                </div>
                <div className="flex-1 max-w-[60px] h-[2px] bg-slate-200 mx-2" />
                <div className={`flex items-center gap-2.5 ${currentStep >= 3 ? "text-[#0a2540]" : "text-slate-400"}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    currentStep === 3 
                      ? "bg-[#0a2540] text-[#d4af37] ring-4 ring-[#0a2540]/10" 
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}>
                    03
                  </span>
                  <span className={`text-xs uppercase tracking-wider font-extrabold ${currentStep === 3 ? "text-[#0a2540]" : "text-slate-500"}`}>
                    Document Collection
                  </span>
                </div>
              </div>

              {/* Mobile Stepper Indicator */}
              <div className="md:hidden flex items-center justify-between">
                <span className="text-xs font-black text-[#0a2540] uppercase tracking-wider">
                  Step {currentStep} of 3: {
                    currentStep === 1 ? "Loan Requirement" : 
                    currentStep === 2 ? "Eligibility Check" : 
                    "Document Collection"
                  }
                </span>
                <span className="text-xs font-black text-[#0a2540] bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {Math.round((currentStep / 3) * 100)}%
                </span>
              </div>
              <div className="md:hidden mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#0a2540] h-full transition-all duration-300"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Selected Customer Profile Context Card */}
          {!isSubmitted && selectedMeeting && (
            <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Application Context Client</p>
                <h4 className="text-sm font-black text-[#0a2540]">
                  {selectedMeeting.customerName || selectedMeeting.leadId?.contactPerson || selectedMeeting.leadId?.companyName || "N/A"}
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Phone: {selectedMeeting.customerPhone || selectedMeeting.leadId?.phoneNumber || "N/A"} 
                  {selectedMeeting.leadId?.companyName && ` | Company: ${selectedMeeting.leadId.companyName}`}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-[10px] font-bold text-slate-600 self-start sm:self-center shrink-0">
                Meeting: {selectedMeeting.date ? new Date(selectedMeeting.date).toLocaleDateString() : "N/A"} at {selectedMeeting.time || "N/A"}
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
                    <p className="flex justify-between"><span className="text-slate-400">Docs Uploaded:</span> <strong className="text-[#0a2540]">{Object.keys(uploadedFiles).length} files</strong></p>
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

                <div className="space-y-4">
                  <span className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    What type of loan does the customer need? *
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {LOAN_TYPES.map((type) => {
                      const IconComp = type.icon;
                      const isSelected = loanType === type.id;
                      return (
                        <div
                          key={type.id}
                          onClick={() => handleLoanTypeSelect(type.id)}
                          className={`cursor-pointer bg-white p-4 rounded-2xl border transition duration-300 shadow-sm flex items-start gap-4 hover:shadow ${
                            isSelected 
                              ? "border-[#0a2540] bg-[#0a2540]/5 ring-2 ring-[#0a2540]/10" 
                              : "border-slate-200 hover:border-[#0a2540]/30"
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            isSelected ? "bg-[#0a2540] text-[#d4af37]" : "bg-slate-100 text-slate-600"
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

                  {/* Conditional Property Loan Type */}
                  <AnimatePresence>
                    {loanType === "Property Loan" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 mt-4 animate-fadeIn"
                      >
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          Property Loan Type *
                        </label>
                        <select
                          value={propertyLoanType}
                          onChange={(e) => setPropertyLoanType(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0a2540]/20"
                        >
                          <option value="">Select Property Loan Type</option>
                          <option value="Industrial Loan">Industrial Loan</option>
                          <option value="Commercial Loan">Commercial Loan</option>
                          <option value="Plot Loan">Plot Loan</option>
                          <option value="Residential Loan">Residential Loan</option>
                        </select>
                        {!propertyLoanType && (
                          <p className="text-[11px] text-rose-500 font-bold mt-1">Please select a Property Loan Type.</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!loanType && (
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

                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Age Input */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        Age *
                      </label>
                      <input
                        type="number"
                        name="age"
                        required
                        value={eligibility.age}
                        onChange={handleEligibilityChange}
                        placeholder="e.g. 30"
                        className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0a2540]/20"
                      />
                      {eligibility.age && (parseInt(eligibility.age, 10) < 18 || parseInt(eligibility.age, 10) > 60) && (
                        <p className="text-[11px] text-rose-500 font-bold mt-1">Age must be between 18 and 60 years.</p>
                      )}
                    </div>

                    {/* Income Input */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
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
                          value={eligibility.income}
                          onChange={handleEligibilityChange}
                          placeholder="e.g. 600000"
                          className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl pl-8 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0a2540]/20"
                        />
                      </div>
                      {eligibility.income && parseFloat(eligibility.income) <= 0 && (
                        <p className="text-[11px] text-rose-500 font-bold mt-1">Income must be a positive amount.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Employment Type */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        Employment Type *
                      </label>
                      <select
                        name="employmentType"
                        required
                        value={eligibility.employmentType}
                        onChange={handleEligibilityChange}
                        className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0a2540]/20"
                      >
                        <option value="">Select Employment Type</option>
                        <option value="Private">Private Sector</option>
                        <option value="Government">Government Sector</option>
                        <option value="Business">Self Employed / Business</option>
                      </select>
                    </div>

                    {/* CIBIL Score */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        CIBIL Score *
                      </label>
                      <input
                        type="number"
                        name="cibilScore"
                        required
                        value={cibilScore}
                        onChange={(e) => setCibilScore(e.target.value)}
                        placeholder="e.g. 750 (700 - 900)"
                        className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0a2540]/20"
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
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          name="companyName"
                          required
                          value={eligibility.companyName}
                          onChange={handleEligibilityChange}
                          placeholder="e.g. Acme Corp Pvt Ltd"
                          className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0a2540]/20"
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
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                          Government Department / Agency *
                        </label>
                        <input
                          type="text"
                          name="govDepartment"
                          required
                          value={eligibility.govDepartment}
                          onChange={handleEligibilityChange}
                          placeholder="e.g. Ministry of Railways"
                          className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0a2540]/20"
                        />
                      </motion.div>
                    )}

                    {eligibility.employmentType === "Business" && (
                      <motion.div
                        key="business-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-100 pt-4 mt-2 space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                              Business Name *
                            </label>
                            <input
                              type="text"
                              name="businessName"
                              required
                              value={eligibility.businessName}
                              onChange={handleEligibilityChange}
                              placeholder="e.g. Apex Enterprises"
                              className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0a2540]/20"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
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
                                value={eligibility.annualTurnover}
                                onChange={handleEligibilityChange}
                                placeholder="e.g. 1500000"
                                className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl pl-8 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0a2540]/20"
                              />
                            </div>
                            {eligibility.annualTurnover && parseFloat(eligibility.annualTurnover) <= 0 && (
                              <p className="text-[11px] text-rose-500 font-bold mt-1">Turnover must be positive.</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                            GST Number *
                          </label>
                          <input
                            type="text"
                            name="gstNumber"
                            required
                            value={eligibility.gstNumber}
                            onChange={handleEligibilityChange}
                            placeholder="e.g. 22AAAAA0000A1Z5"
                            className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0a2540]/20 uppercase"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              /* Step 3: Document Collection */
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-[#0a2540]">
                  <h2 className="text-base sm:text-lg font-black text-[#0a2540] flex items-center gap-2">
                    <span className="bg-[#0a2540]/5 text-[#0a2540] w-6 h-6 rounded-md flex items-center justify-center text-xs">3</span>
                    Document Collection
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Upload clear, scanned PDF or image copies of the required verification credentials. Max size is 10 MB per file.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {getActiveDocuments().map((doc) => {
                    const fileInfo = uploadedFiles[doc.id];
                    const progress = uploadProgress[doc.id];
                    const error = uploadErrors[doc.id];

                    return (
                      <div 
                        key={doc.id}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                            <span className="text-xs font-black text-[#0a2540]">
                              {doc.title} {doc.required && <span className="text-rose-500">*</span>}
                            </span>
                            {fileInfo ? (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider border border-emerald-200">
                                <CheckCircle size={10} /> Verified
                              </span>
                            ) : (
                              <span className="text-[10px] bg-slate-50 text-slate-400 font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-slate-200">
                                Pending
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[11px] text-slate-400 mb-3 font-medium">{doc.desc}</p>
                        </div>

                        {/* File Upload Content State */}
                        <div className="mt-2">
                          {progress !== undefined ? (
                            /* Simulated Progress State */
                            <div className="space-y-2 py-4">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                <span className="flex items-center gap-1.5">
                                  <Loader2 size={12} className="animate-spin text-[#0a2540]" />
                                  Uploading file...
                                </span>
                                <span>{progress}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-[#0a2540] h-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          ) : fileInfo ? (
                            /* Uploaded Complete State */
                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3">
                              {/* Preview Thumbnail or PDF Icon */}
                              {fileInfo.previewUrl ? (
                                <img 
                                  src={fileInfo.previewUrl} 
                                  alt="Preview" 
                                  className="w-12 h-12 object-cover rounded-lg border border-slate-300 shadow-xs bg-white shrink-0" 
                                />
                              ) : (
                                <div className="w-12 h-12 bg-rose-50 text-rose-500 border border-rose-200 rounded-lg flex items-center justify-center shrink-0">
                                  <FileText size={24} />
                                </div>
                              )}

                              {/* File Meta info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-[#0a2540] truncate">
                                  {fileInfo.name}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                  {fileInfo.size}
                                </p>
                              </div>

                              {/* Action buttons for loaded file */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => triggerUpload(doc.id)}
                                  className="p-1.5 text-slate-400 hover:text-[#0a2540] hover:bg-slate-100 rounded-lg transition"
                                  title="Replace File"
                                >
                                  <RefreshCw size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeFile(doc.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete File"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Trigger Upload Dropzone UI */
                            <div>
                              <button
                                type="button"
                                onClick={() => triggerUpload(doc.id)}
                                className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-[#0a2540]/30 bg-slate-50 hover:bg-slate-100/50 rounded-xl flex flex-col items-center justify-center gap-1.5 transition text-center"
                              >
                                <Upload className="text-slate-400" size={16} />
                                <span className="text-xs font-bold text-slate-600">
                                  Upload Document
                                </span>
                              </button>
                            </div>
                          )}

                          {/* Error Validation UI */}
                          {error && (
                            <div className="mt-2 text-[10px] text-rose-500 font-bold flex items-start gap-1 bg-rose-50 p-2 rounded-lg border border-rose-100">
                              <AlertCircle size={12} className="shrink-0 mt-0.5" />
                              <span>{error}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
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
            {currentStep < 3 ? (
              <button
                type="button"
                disabled={currentStep === 1 ? !isStep1Valid() : !isStep2Valid()}
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="bg-[#0a2540] hover:bg-[#0a2540]/90 text-[#d4af37] px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFormSubmit}
                disabled={!isStep3Valid() || isSubmitting}
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
              className="bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl w-full z-50 p-6 flex flex-col space-y-4 pb-8"
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

              <div className="grid grid-cols-2 gap-4 pt-2">
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
