import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Briefcase, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";
import api from "../api";

export default function NewLeadView() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeCompanyIndex, setActiveCompanyIndex] = useState(0);
  const [activeContactIndex, setActiveContactIndex] = useState(0);
  const [activePhoneIndex, setActivePhoneIndex] = useState(0);
  const [activeTurnoverIndex, setActiveTurnoverIndex] = useState(0);

  const { 
    register, 
    handleSubmit, 
    watch, 
    reset,
    setValue, 
    clearErrors,
    formState: { errors } 
  } = useForm({
    defaultValues: {
      companyName0: "",
      companyName1: "",
      contactPerson0: "",
      contactPerson1: "",
      contactPerson2: "",
      contactPerson3: "",
      phone0: "",
      phone1: "",
      phone2: "",
      phone3: "",
      city: "",

      state: "",
      companyTurnover: "",
      turnoverAmount0: "",
      turnoverAmount1: "",
      turnoverAmount2: "",
      turnoverUnit0: "Cr",
      turnoverUnit1: "Cr",
      turnoverUnit2: "Cr",
      loanAmount: "",
      loanAmountInput: "",
      loanAmountUnit: "Cr",
      loanType: "",
      propertyLoanCategory: "",
      propertyPurchaseCategory: "",
      ppLocation: "",
      ppMarketRate: "",
      ppDastavejRate: "",
      ppDastavejName: "",
      propertyLocation: "",
      durationOfRentProperty: "",
      lapPropertyType: "",
      lapPropertyLocation: "",
      lapPropertyMarketValue: "",
      lapPropertyWork: "",
      lapPropertyDocumentList: "",
      unsoldUnit: "",
      unsoldMV: "",
      businessStartingYear: "",
      businessTypeOfWork: "",
      unsoldBV: false,
      unsoldScheme: "",
      unsoldLocation: "",
      unsoldFloor: "",
      unsoldDastavej: "",
      unsoldPartnership: "",
      lrdRent: "",
      lrdMarketValue: "",
      lrdLocation: "",
      lrdLoiYear: "",
      lrdSchemeName: "",
      lrdDastavej: "",
      naPlotLocation: "",
      naPlotMV: "",
      naPlotYesNo: false,
      naPlotDastavej: "",
      naPlotVAR: "",
      naPlotScheme: "",
      naPlotLavani: "",
      naPlotVacant: false,
      businessLoanType: "",
      btBankName: "",
      btRateOfInterest: "",
      btPropertyType: "",
      btMarketValue: "",
      btLocation: "",
      btDuration: "",
      btOutstanding: "",
      btForeclosureCharge: "",
      interested: "",
      callStatus: "",
      meetingDate: "",
      meetingTime: "",
      address: "",
      remarks: "",
      followUpDate: "",
      followUpTime: ""
    }
  });

  const interestedValue = watch("interested");
  const callStatusValue = watch("callStatus");
  const loanTypeValue = watch("loanType");
  const lapPropertyTypeValue = watch("lapPropertyType");
  const propertyLoanCategoryValue = watch("propertyLoanCategory");
  const unsoldBVValue = watch("unsoldBV");
  const businessLoanTypeValue = watch("businessLoanType");
  const naPlotVacantValue = watch("naPlotVacant");

  const isWrongNumber = callStatusValue === "Wrong Number";
  const isFollowUp = !isWrongNumber && (interestedValue === "Call Back Later" || callStatusValue === "Busy");
  const isAllMandatory = interestedValue === "Yes" && !isWrongNumber;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Auto-set Interested to "Call Back Later" if Call Status is Busy
  useEffect(() => {
    if (callStatusValue === "Busy" && (!interestedValue || interestedValue === "")) {
      setValue("interested", "Call Back Later");
    }
  }, [callStatusValue, interestedValue, setValue]);

  // Dynamic registration of Turnover and Loan Amount based on mode
  useEffect(() => {
    // Company Turnover is NOT mandatory for any loan type or mode
    register("turnoverAmount0", { 
      required: false,
      validate: (val) => !val || parseFloat(val) > 0 || "Turnover must be greater than 0"
    });
    clearErrors(["turnoverAmount0", "companyTurnover"]);

    if (isAllMandatory) {
      register("loanAmountInput", {
        required: "Loan Amount is required",
        validate: (val) => (val && parseFloat(val) > 0) || "Loan Amount is required"
      });
    } else {
      register("loanAmountInput", {
        required: false,
        validate: (val) => !val || parseFloat(val) > 0 || "Loan Amount must be greater than 0"
      });
      clearErrors([
        "turnoverAmount0", "companyTurnover", "loanAmountInput", "loanAmount", "loanType",
        "propertyPurchaseCategory", "ppLocation", "ppMarketRate", "ppDastavejRate", "ppDastavejName",
        "propertyLoanCategory", "propertyLocation", "durationOfRentProperty", "unsoldUnit", "unsoldMV",
        "unsoldScheme", "unsoldLocation", "unsoldFloor", "unsoldDastavej", "unsoldPartnership",
        "lrdRent", "lrdMarketValue", "lrdLocation", "lrdLoiYear", "lrdSchemeName", "lrdDastavej",
        "naPlotLocation", "naPlotMV", "naPlotDastavej", "naPlotVAR", "naPlotScheme",
        "lapPropertyType", "lapPropertyLocation", "lapPropertyMarketValue", "lapPropertyWork", "lapPropertyDocumentList",
        "businessLoanType", "businessStartingYear", "businessTypeOfWork",
        "btBankName", "btRateOfInterest", "btPropertyType", "btMarketValue", "btLocation", "btDuration", "btOutstanding", "btForeclosureCharge",
        "address"
      ]);
    }
  }, [isAllMandatory, register, clearErrors]);

  // When Wrong Number is selected, clear contact and location errors
  useEffect(() => {
    if (isWrongNumber) {
      clearErrors(["companyName0", "contactPerson0", "state", "city", "followUpDate", "followUpTime"]);
    }
  }, [isWrongNumber, clearErrors]);

  useEffect(() => {
    register("turnoverAmount1", { 
      required: false,
      validate: (val) => !val || parseFloat(val) > 0 || "Turnover must be greater than 0"
    });
    register("turnoverAmount2", { 
      required: false,
      validate: (val) => !val || parseFloat(val) > 0 || "Turnover must be greater than 0"
    });

    const preventWheel = (e) => {
      if (document.activeElement && (document.activeElement.type === "number" || document.activeElement.getAttribute("inputmode") === "decimal")) {
        document.activeElement.blur();
      }
    };
    window.addEventListener("wheel", preventWheel, { passive: true });
    return () => window.removeEventListener("wheel", preventWheel);
  }, [register]);

  const handleTurnoverChange = (e, idx) => {
    let val = e.target.value.replace(/[^0-9.]/g, "");
    const parts = val.split(".");
    if (parts.length > 2) {
      val = parts[0] + "." + parts.slice(1).join("");
    }
    setValue(`turnoverAmount${idx}`, val, { shouldValidate: true, shouldDirty: true });
    if (!val || parseFloat(val) > 0) {
      clearErrors(`turnoverAmount${idx}`);
      if (idx === 0) clearErrors("companyTurnover");
    }
  };

  const handleTurnoverUnitChange = (e, idx) => {
    const unit = e.target.value;
    setValue(`turnoverUnit${idx}`, unit, { shouldValidate: true, shouldDirty: true });
  };

  const handleLoanAmountChange = (e) => {
    let val = e.target.value.replace(/[^0-9.]/g, "");
    const parts = val.split(".");
    if (parts.length > 2) {
      val = parts[0] + "." + parts.slice(1).join("");
    }
    setValue("loanAmountInput", val, { shouldValidate: true, shouldDirty: true });
    if (val && parseFloat(val) > 0) {
      clearErrors("loanAmountInput");
      clearErrors("loanAmount");
    }
  };

  const handleLoanAmountUnitChange = (e) => {
    const unit = e.target.value;
    setValue("loanAmountUnit", unit, { shouldValidate: true, shouldDirty: true });
  };

  const handleKeyDownNoSign = (e) => {
    if (['-', '+', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur();
    }
  };

  const getTurnoverInINR = (amount, unit = "Cr") => {
    if (!amount || isNaN(parseFloat(amount))) return null;
    const num = parseFloat(amount);
    if (num <= 0) return null;
    let inr = num;
    if (unit === "Cr") inr = num * 10000000;
    else if (unit === "Lakhs") inr = num * 100000;
    return Math.round(inr);
  };

  const onSubmitLead = async (data) => {
    setLoading(true);
    try {


      const companyNames = [data.companyName0, data.companyName1].filter(Boolean).map(s => s.trim()).filter(Boolean).join(", ");
      const contactPersons = [data.contactPerson0, data.contactPerson1, data.contactPerson2, data.contactPerson3].filter(Boolean).map(s => s.trim()).filter(Boolean).join(", ");
      const phoneNumbers = [data.phone0, data.phone1, data.phone2, data.phone3].filter(Boolean).map(s => s.trim()).filter(Boolean).join(", ");

      const turnover0 = getTurnoverInINR(data.turnoverAmount0, data.turnoverUnit0 || "Cr");
      const turnover1 = getTurnoverInINR(data.turnoverAmount1, data.turnoverUnit1 || "Cr");
      const turnover2 = getTurnoverInINR(data.turnoverAmount2, data.turnoverUnit2 || "Cr");
      const loanAmountConverted = getTurnoverInINR(data.loanAmountInput, data.loanAmountUnit || "Cr");

      const payload = {
        ...data,
        companyName: isWrongNumber ? (companyNames || "Wrong Number") : companyNames,
        contactPerson: isWrongNumber ? (contactPersons || "Wrong Number") : contactPersons,
        phoneNumber: phoneNumbers,
        companyTurnover: turnover0 !== null ? turnover0 : (data.companyTurnover ? parseFloat(data.companyTurnover) : undefined),
        companyTurnover1: turnover1 !== null ? turnover1 : undefined,
        companyTurnover2: turnover2 !== null ? turnover2 : undefined,
        loanAmount: loanAmountConverted !== null ? loanAmountConverted : (data.loanAmount ? parseFloat(data.loanAmount) : undefined)
      };
      
      delete payload.companyName0;
      delete payload.companyName1;
      delete payload.contactPerson0;
      delete payload.contactPerson1;
      delete payload.contactPerson2;
      delete payload.contactPerson3;
      delete payload.phone0;
      delete payload.phone1;
      delete payload.phone2;
      delete payload.phone3;
      delete payload.turnoverAmount0;
      delete payload.turnoverAmount1;
      delete payload.turnoverAmount2;
      delete payload.turnoverUnit0;
      delete payload.turnoverUnit1;
      delete payload.turnoverUnit2;
      delete payload.loanAmountInput;
      delete payload.loanAmountUnit;

      if (isWrongNumber) {
        payload.interested = "No";
        payload.callStatus = "Wrong Number";
        delete payload.loanType;
        delete payload.propertyLoanCategory;
        delete payload.propertyPurchaseCategory;
        delete payload.meetingDate;
        delete payload.meetingTime;
        delete payload.followUpDate;
        delete payload.followUpTime;
      } else {
        if (!payload.loanType) {
          delete payload.loanType;
        }
        if (payload.loanType !== "Property Purchase Loan") {
          delete payload.propertyPurchaseCategory;
          delete payload.ppLocation;
          delete payload.ppMarketRate;
          delete payload.ppDastavejRate;
          delete payload.ppDastavejName;
        }
        if (payload.loanType !== "Property Loan") {
          delete payload.propertyLoanCategory;
          delete payload.propertyLocation;
          delete payload.durationOfRentProperty;
        } else if (!["Working Capital"].includes(payload.propertyLoanCategory)) {
          delete payload.propertyLocation;
          delete payload.durationOfRentProperty;
        }
        if (payload.propertyLoanCategory !== "LAP") {
          delete payload.lapPropertyType;
          delete payload.lapPropertyLocation;
          delete payload.lapPropertyMarketValue;
          delete payload.lapPropertyWork;
          delete payload.lapPropertyDocumentList;
        }
        if (payload.propertyLoanCategory !== "Unsold") {
          delete payload.unsoldUnit;
          delete payload.unsoldMV;
          delete payload.unsoldBV;
          delete payload.unsoldScheme;
          delete payload.unsoldLocation;
          delete payload.unsoldFloor;
          delete payload.unsoldDastavej;
          delete payload.unsoldPartnership;
        }
        if (payload.propertyLoanCategory !== "LRD") {
          delete payload.lrdRent;
          delete payload.lrdMarketValue;
          delete payload.lrdLocation;
          delete payload.lrdLoiYear;
          delete payload.lrdSchemeName;
          delete payload.lrdDastavej;
        }
        if (payload.propertyLoanCategory !== "NA Plot") {
          delete payload.naPlotLocation;
          delete payload.naPlotMV;
          delete payload.naPlotYesNo;
          delete payload.naPlotDastavej;
          delete payload.naPlotVAR;
          delete payload.naPlotScheme;
          delete payload.naPlotLavani;
          delete payload.naPlotVacant;
        }
        if (payload.loanType !== "Business Loan") {
          delete payload.businessLoanType;
          delete payload.businessStartingYear;
          delete payload.businessTypeOfWork;
        }
        if (payload.loanType !== "Balance Transfer") {
          delete payload.btBankName;
          delete payload.btRateOfInterest;
          delete payload.btPropertyType;
          delete payload.btMarketValue;
          delete payload.btLocation;
          delete payload.btDuration;
          delete payload.btOutstanding;
          delete payload.btForeclosureCharge;
        }

        if (!payload.meetingDate) delete payload.meetingDate;
        if (!payload.meetingTime) delete payload.meetingTime;
        if (payload.interested !== "Call Back Later" && payload.callStatus !== "Busy") {
          delete payload.followUpDate;
          delete payload.followUpTime;
        } else {
          if (!payload.followUpDate) delete payload.followUpDate;
          if (!payload.followUpTime) delete payload.followUpTime;
        }
      }

      const res = await api.post("/leads", payload);

      if (res.data.success) {
        const successMsg = isWrongNumber 
          ? "Lead marked as Wrong Number." 
          : isFollowUp 
            ? "Follow-up lead saved successfully!" 
            : "Lead saved successfully!";
        showToast(successMsg, "success");
        reset();
        setActiveCompanyIndex(0);
        setActiveContactIndex(0);
        setActivePhoneIndex(0);
        setActiveTurnoverIndex(0);
      }
    } catch (error) {
      console.error("Error saving lead:", error);
      showToast(error.response?.data?.message || "Failed to save lead.", "error");
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "block text-[13px] font-semibold text-slate-700 mb-2";
  const getInputClass = (hasError) => 
    `w-full px-4 py-3 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all duration-200 ${
      hasError 
        ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/50" 
        : "border-slate-200 focus:border-[#162335] focus:ring-2 focus:ring-[#162335]/20 focus:bg-white"
    }`;

  const loanUnitVal = watch("loanAmountUnit") || "Cr";
  const loanInrVal = getTurnoverInINR(watch("loanAmountInput"), loanUnitVal);

  return (
    <div className="space-y-6">
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

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl shadow-slate-200/40">
        <div className="border-b border-slate-100 pb-4 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-xl font-bold text-[#162335] flex items-center gap-3">
            <Briefcase size={22} className="text-[#9ca3af]" />
            New Loan Lead Entry
          </h3>
          {isFollowUp ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 w-fit">
              <Clock size={13} /> Follow-up Mode (5 Basic Info + Schedule Required)
            </span>
          ) : isWrongNumber ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5 w-fit">
              <AlertCircle size={13} /> Wrong Number Mode (Phone Required Only)
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 w-fit">
              <CheckCircle size={13} /> Standard Lead Mode
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmitLead)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div>
              <label className={labelClass}>Company Name {!isWrongNumber && "*"}</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {[0, 1].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveCompanyIndex(idx)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                      activeCompanyIndex === idx 
                        ? "bg-[#162335] text-white border-[#162335] shadow-md" 
                        : errors[`companyName${idx}`]
                          ? "bg-rose-50 text-rose-600 border-rose-300 hover:bg-rose-100"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    Company {idx + 1}
                  </button>
                ))}
              </div>
              {[0, 1].map((idx) => (
                <div key={idx} className={activeCompanyIndex === idx ? "block" : "hidden"}>
                  <input 
                    type="text" 
                    placeholder="Enter company name" 
                    {...register(`companyName${idx}`, { required: isWrongNumber ? false : (idx === 0 ? "Primary Company Name is required" : false) })} 
                    className={getInputClass(errors[`companyName${idx}`])} 
                  />
                  {errors[`companyName${idx}`] && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors[`companyName${idx}`].message}</p>}
                </div>
              ))}
            </div>

            <div>
              <label className={labelClass}>Contact Person Name {!isWrongNumber && "*"}</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {[0, 1, 2, 3].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveContactIndex(idx)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                      activeContactIndex === idx 
                        ? "bg-[#162335] text-white border-[#162335] shadow-md" 
                        : errors[`contactPerson${idx}`]
                          ? "bg-rose-50 text-rose-600 border-rose-300 hover:bg-rose-100"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    Person {idx + 1}
                  </button>
                ))}
              </div>
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className={activeContactIndex === idx ? "block" : "hidden"}>
                  <input 
                    type="text" 
                    placeholder="Enter full name" 
                    {...register(`contactPerson${idx}`, { required: isWrongNumber ? false : (idx === 0 ? "Primary Contact Person is required" : false) })} 
                    className={getInputClass(errors[`contactPerson${idx}`])} 
                  />
                  {errors[`contactPerson${idx}`] && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors[`contactPerson${idx}`].message}</p>}
                </div>
              ))}
            </div>

            <div>
              <label className={labelClass}>Phone Number *</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {[0, 1, 2, 3].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhoneIndex(idx)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                      activePhoneIndex === idx 
                        ? "bg-[#162335] text-white border-[#162335] shadow-md" 
                        : errors[`phone${idx}`]
                          ? "bg-rose-50 text-rose-600 border-rose-300 hover:bg-rose-100"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    Phone {idx + 1}
                  </button>
                ))}
              </div>
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className={activePhoneIndex === idx ? "block" : "hidden"}>
                  <input 
                    type="tel" 
                    placeholder="10-digit mobile number" 
                    {...register(`phone${idx}`, { 
                      required: idx === 0 ? "Primary Phone is required" : false, 
                      pattern: { value: /^[6-9]\d{9}$/, message: "Indian mobile only (10 digits starting with 6-9)" }
                    })} 
                    className={getInputClass(errors[`phone${idx}`])} 
                  />
                  {errors[`phone${idx}`] && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors[`phone${idx}`].message}</p>}
                </div>
              ))}
            </div>

            <div>
              <label className={labelClass}>
                Company Turnover (INR) <span className="text-slate-400 font-normal text-xs">(Optional)</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {['T1', 'T2', 'T3'].map((t, idx) => {
                  const hasErr = errors[`turnoverAmount${idx}`];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveTurnoverIndex(idx)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                        activeTurnoverIndex === idx 
                          ? "bg-[#162335] text-white border-[#162335] shadow-md" 
                          : hasErr
                            ? "bg-rose-50 text-rose-600 border-rose-300 hover:bg-rose-100"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              {['T1', 'T2', 'T3'].map((t, idx) => {
                const amountVal = watch(`turnoverAmount${idx}`) || "";
                const unitVal = watch(`turnoverUnit${idx}`) || "Cr";
                const inrVal = getTurnoverInINR(amountVal, unitVal);
                const hasErr = errors[`turnoverAmount${idx}`];

                return (
                  <div key={idx} className={activeTurnoverIndex === idx ? "block" : "hidden"}>
                    <div className={`flex items-stretch rounded-xl border overflow-hidden transition-all duration-200 ${
                      hasErr
                        ? "border-rose-400 ring-2 ring-rose-500/20 bg-rose-50/50" 
                        : "border-slate-200 focus-within:border-[#162335] focus-within:ring-2 focus-within:ring-[#162335]/20 focus-within:bg-white bg-slate-50"
                    }`}>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={amountVal}
                        onChange={(e) => handleTurnoverChange(e, idx)}
                        onKeyDown={handleKeyDownNoSign}
                        onWheel={(e) => e.target.blur()}
                        placeholder={unitVal === "Cr" ? "e.g. 5" : unitVal === "Lakhs" ? "e.g. 50" : "e.g. 600000"} 
                        className="w-full px-4 py-3 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      />
                      <div className="relative border-l border-slate-200 flex items-center bg-slate-100/70">
                        <select
                          {...register(`turnoverUnit${idx}`)}
                          onChange={(e) => handleTurnoverUnitChange(e, idx)}
                          className="h-full pl-3 pr-8 py-3 bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer appearance-none hover:text-[#162335] transition-colors"
                        >
                          <option value="Cr">Cr</option>
                          <option value="Lakhs">Lakhs</option>
                          <option value="Rupees">₹ (Rupees)</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    {inrVal ? (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50/70 px-3 py-1.5 rounded-lg border border-emerald-200/60 w-fit">
                        <span>≈ ₹{inrVal.toLocaleString("en-IN")}</span>
                        <span className="text-slate-500 font-normal">({amountVal} {unitVal})</span>
                      </div>
                    ) : null}
                    {hasErr && (
                      <p className="text-xs text-rose-500 mt-1.5 font-medium">
                        {hasErr.message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div>
              <label className={labelClass}>State {!isWrongNumber && "*"}</label>
              <input 
                type="text" 
                placeholder="Enter state" 
                {...register("state", { required: isWrongNumber ? false : "State is required" })} 
                className={getInputClass(errors.state)} 
              />
              {errors.state && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.state.message}</p>}
            </div>

            <div>
              <label className={labelClass}>City {!isWrongNumber && "*"}</label>
              <input 
                type="text" 
                placeholder="Enter city" 
                {...register("city", { required: isWrongNumber ? false : "City is required" })} 
                className={getInputClass(errors.city)} 
              />
              {errors.city && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.city.message}</p>}
            </div>

            <div>
              <label className={labelClass}>
                Loan Amount Required {isAllMandatory ? "*" : <span className="text-slate-400 font-normal text-xs">(Optional for Follow-up)</span>}
              </label>
              <div className={`flex items-stretch rounded-xl border overflow-hidden transition-all duration-200 ${
                errors.loanAmountInput
                  ? "border-rose-400 ring-2 ring-rose-500/20 bg-rose-50/50" 
                  : "border-slate-200 focus-within:border-[#162335] focus-within:ring-2 focus-within:ring-[#162335]/20 focus-within:bg-white bg-slate-50"
              }`}>
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={watch("loanAmountInput") || ""}
                  onChange={handleLoanAmountChange}
                  onKeyDown={handleKeyDownNoSign}
                  onWheel={(e) => e.target.blur()}
                  placeholder={loanUnitVal === "Cr" ? "e.g. 1.5" : loanUnitVal === "Lakhs" ? "e.g. 50" : "e.g. 1500000"} 
                  className="w-full px-4 py-3 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
                <div className="relative border-l border-slate-200 flex items-center bg-slate-100/70">
                  <select
                    {...register("loanAmountUnit")}
                    onChange={handleLoanAmountUnitChange}
                    className="h-full pl-3 pr-8 py-3 bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer appearance-none hover:text-[#162335] transition-colors"
                  >
                    <option value="Cr">Cr</option>
                    <option value="Lakhs">Lakhs</option>
                    <option value="Rupees">₹ (Rupees)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              {loanInrVal ? (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50/70 px-3 py-1.5 rounded-lg border border-emerald-200/60 w-fit">
                  <span>≈ ₹{loanInrVal.toLocaleString("en-IN")}</span>
                  <span className="text-slate-500 font-normal">({watch("loanAmountInput")} {loanUnitVal})</span>
                </div>
              ) : null}
              {errors.loanAmountInput && (
                <p className="text-xs text-rose-500 mt-1.5 font-medium">
                  {errors.loanAmountInput.message}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                Type of Loan {isAllMandatory ? "*" : <span className="text-slate-400 font-normal text-xs">(Optional for Follow-up)</span>}
              </label>
              <select {...register("loanType", { required: isAllMandatory ? "Loan Type is required" : false })} className={getInputClass(errors.loanType)}>
                <option value="">Select Loan Type</option>
                <option value="Property Purchase Loan">Property Purchase Loan</option>
                <option value="Business Loan">Business Loan</option>
                <option value="Property Loan">Property Loan</option>
                <option value="Balance Transfer">Balance Transfer</option>
              </select>
              {errors.loanType && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.loanType.message}</p>}
            </div>

            {loanTypeValue === "Property Purchase Loan" && (
              <>
                <div>
                  <label className={labelClass}>Type of Category</label>
                  <select {...register("propertyPurchaseCategory")} className={getInputClass(errors.propertyPurchaseCategory)}>
                    <option value="">Select Category</option>
                    <option value="Home">Home</option>
                    <option value="NA Plot">NA Plot</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Residential">Residential</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                  {errors.propertyPurchaseCategory && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.propertyPurchaseCategory.message}</p>}
                </div>
                {watch("propertyPurchaseCategory") && (
                  <>
                    <div>
                      <label className={labelClass}>Property of Location</label>
                      <input type="text" placeholder="Enter location" {...register("ppLocation")} className={getInputClass(errors.ppLocation)} />
                      {errors.ppLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.ppLocation.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Market Rate</label>
                      <input type="number" placeholder="Enter market rate" {...register("ppMarketRate", { min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.ppMarketRate)} />
                      {errors.ppMarketRate && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.ppMarketRate.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Document List Rate</label>
                      <input type="number" placeholder="Enter dastavej rate" {...register("ppDastavejRate", { min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.ppDastavejRate)} />
                      {errors.ppDastavejRate && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.ppDastavejRate.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Ownership Name</label>
                      <input type="text" placeholder="Enter ownership name" {...register("ppDastavejName")} className={getInputClass(errors.ppDastavejName)} />
                      {errors.ppDastavejName && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.ppDastavejName.message}</p>}
                    </div>
                  </>
                )}
              </>
            )}

            {loanTypeValue === "Property Loan" && (
              <>
                <div>
                  <label className={labelClass}>Property Loan Category</label>
                  <select {...register("propertyLoanCategory")} className={getInputClass(errors.propertyLoanCategory)}>
                    <option value="">Select Category</option>
                    <option value="Working Capital">Working Capital</option>
                    <option value="LAP">LAP</option>
                    <option value="Unsold">Unsold</option>
                    <option value="LRD">LRD</option>
                    <option value="NA Plot">NA Plot</option>
                  </select>
                  {errors.propertyLoanCategory && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.propertyLoanCategory.message}</p>}
                </div>
                {["Working Capital"].includes(propertyLoanCategoryValue) && (
                  <>
                    <div>
                      <label className={labelClass}>Property Location</label>
                      <input type="text" placeholder="Enter location" {...register("propertyLocation")} className={getInputClass(errors.propertyLocation)} />
                      {errors.propertyLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.propertyLocation.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Duration of Rent Property</label>
                      <input type="text" placeholder="e.g. 5 Years" {...register("durationOfRentProperty")} className={getInputClass(errors.durationOfRentProperty)} />
                      {errors.durationOfRentProperty && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.durationOfRentProperty.message}</p>}
                    </div>
                  </>
                )}
              </>
            )}

            {loanTypeValue === "Property Loan" && propertyLoanCategoryValue === "Unsold" && (
              <>
                <div>
                  <label className={labelClass}>Unit</label>
                  <input type="text" placeholder="Enter unit" {...register("unsoldUnit")} className={getInputClass(errors.unsoldUnit)} />
                  {errors.unsoldUnit && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.unsoldUnit.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Property Market Value</label>
                  <input type="number" placeholder="Enter M.V" {...register("unsoldMV", { min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.unsoldMV)} />
                  {errors.unsoldMV && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.unsoldMV.message}</p>}
                </div>
                
                <div>
                  <label className={labelClass}>B.U</label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setValue("unsoldBV", true, { shouldValidate: true })}
                      className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                        unsoldBVValue === true
                          ? "border-[#162335] bg-[#162335]/5 text-[#162335]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Yes
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        unsoldBVValue === true
                          ? "border-[#162335] bg-[#162335]"
                          : "border-slate-300"
                      }`}>
                        {unsoldBVValue === true && <CheckCircle size={14} className="text-white" />}
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setValue("unsoldBV", false, { shouldValidate: true })}
                      className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                        unsoldBVValue === false
                          ? "border-[#162335] bg-[#162335]/5 text-[#162335]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      No
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        unsoldBVValue === false
                          ? "border-[#162335] bg-[#162335]"
                          : "border-slate-300"
                      }`}>
                        {unsoldBVValue === false && <CheckCircle size={14} className="text-white" />}
                      </div>
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Scheme Name</label>
                  <input type="text" placeholder="Enter scheme" {...register("unsoldScheme")} className={getInputClass(errors.unsoldScheme)} />
                  {errors.unsoldScheme && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.unsoldScheme.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Property of Location</label>
                  <input type="text" placeholder="Enter location" {...register("unsoldLocation")} className={getInputClass(errors.unsoldLocation)} />
                  {errors.unsoldLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.unsoldLocation.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Floor</label>
                  <input type="text" placeholder="Enter floor" {...register("unsoldFloor")} className={getInputClass(errors.unsoldFloor)} />
                  {errors.unsoldFloor && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.unsoldFloor.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Document List</label>
                  <input type="text" placeholder="Enter dastavej" {...register("unsoldDastavej")} className={getInputClass(errors.unsoldDastavej)} />
                  {errors.unsoldDastavej && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.unsoldDastavej.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Partnership</label>
                  <input type="text" placeholder="Enter partnership" {...register("unsoldPartnership")} className={getInputClass(errors.unsoldPartnership)} />
                  {errors.unsoldPartnership && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.unsoldPartnership.message}</p>}
                </div>
              </>
            )}

            {loanTypeValue === "Property Loan" && propertyLoanCategoryValue === "LRD" && (
              <>
                <div>
                  <label className={labelClass}>Rent</label>
                  <input type="number" placeholder="Enter rent" {...register("lrdRent", { min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.lrdRent)} />
                  {errors.lrdRent && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lrdRent.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Market Value</label>
                  <input type="number" placeholder="Enter market value" {...register("lrdMarketValue", { min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.lrdMarketValue)} />
                  {errors.lrdMarketValue && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lrdMarketValue.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Property of Location</label>
                  <input type="text" placeholder="Enter location" {...register("lrdLocation")} className={getInputClass(errors.lrdLocation)} />
                  {errors.lrdLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lrdLocation.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>LOI Year</label>
                  <input type="text" placeholder="Enter LOI year" {...register("lrdLoiYear")} className={getInputClass(errors.lrdLoiYear)} />
                  {errors.lrdLoiYear && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lrdLoiYear.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Scheme Name</label>
                  <input type="text" placeholder="Enter scheme name" {...register("lrdSchemeName")} className={getInputClass(errors.lrdSchemeName)} />
                  {errors.lrdSchemeName && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lrdSchemeName.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Document List</label>
                  <input type="text" placeholder="Enter dastavej" {...register("lrdDastavej")} className={getInputClass(errors.lrdDastavej)} />
                  {errors.lrdDastavej && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lrdDastavej.message}</p>}
                </div>
              </>
            )}

            {loanTypeValue === "Property Loan" && propertyLoanCategoryValue === "NA Plot" && (
              <>
                <div>
                  <label className={labelClass}>Property of Location</label>
                  <input type="text" placeholder="Enter location" {...register("naPlotLocation")} className={getInputClass(errors.naPlotLocation)} />
                  {errors.naPlotLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotLocation.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Property Market Value</label>
                  <input type="number" placeholder="Enter M.V" {...register("naPlotMV", { min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.naPlotMV)} />
                  {errors.naPlotMV && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotMV.message}</p>}
                </div>
                <div className="hidden">
                  <input type="checkbox" id="naPlotYesNo" {...register("naPlotYesNo")} />
                </div>
                <div>
                  <label className={labelClass}>Document List</label>
                  <input type="text" placeholder="Enter dastavej" {...register("naPlotDastavej")} className={getInputClass(errors.naPlotDastavej)} />
                  {errors.naPlotDastavej && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotDastavej.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>VAR</label>
                  <input type="text" placeholder="Enter VAR" {...register("naPlotVAR")} className={getInputClass(errors.naPlotVAR)} />
                  {errors.naPlotVAR && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotVAR.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Scheme Name</label>
                  <input type="text" placeholder="Enter scheme" {...register("naPlotScheme")} className={getInputClass(errors.naPlotScheme)} />
                  {errors.naPlotScheme && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotScheme.message}</p>}
                </div>
                <div className="hidden">
                  <input type="text" defaultValue="N/A" {...register("naPlotLavani")} />
                </div>
                <div>
                  <label className={labelClass}>Plot Vacant</label>
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      type="button"
                      onClick={() => setValue("naPlotVacant", true, { shouldValidate: true })}
                      className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                        naPlotVacantValue === true
                          ? "border-[#162335] bg-[#162335]/5 text-[#162335]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Yes
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        naPlotVacantValue === true
                          ? "border-[#162335] bg-[#162335]"
                          : "border-slate-300"
                      }`}>
                        {naPlotVacantValue === true && <CheckCircle size={14} className="text-white" />}
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setValue("naPlotVacant", false, { shouldValidate: true })}
                      className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                        naPlotVacantValue === false
                          ? "border-[#162335] bg-[#162335]/5 text-[#162335]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      No
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        naPlotVacantValue === false
                          ? "border-[#162335] bg-[#162335]"
                          : "border-slate-300"
                      }`}>
                        {naPlotVacantValue === false && <CheckCircle size={14} className="text-white" />}
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}

            {loanTypeValue === "Property Loan" && propertyLoanCategoryValue === "LAP" && (
              <>
                <div>
                  <label className={labelClass}>Property Type</label>
                  <select {...register("lapPropertyType")} className={getInputClass(errors.lapPropertyType)}>
                    <option value="">Select Property Type</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Residential">Residential</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                  {errors.lapPropertyType && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lapPropertyType.message}</p>}
                </div>
                {lapPropertyTypeValue && ["Residential", "Commercial", "Industrial"].includes(lapPropertyTypeValue) && (
                  <>
                    <div>
                      <label className={labelClass}>Property Location</label>
                      <input type="text" placeholder="Enter location" {...register("lapPropertyLocation")} className={getInputClass(errors.lapPropertyLocation)} />
                      {errors.lapPropertyLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lapPropertyLocation.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Property Market Value</label>
                      <input type="number" placeholder="Enter market value" {...register("lapPropertyMarketValue", { min: { value: 0, message: "Value must be positive" } })} className={getInputClass(errors.lapPropertyMarketValue)} />
                      {errors.lapPropertyMarketValue && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lapPropertyMarketValue.message}</p>}
                    </div>
                      <div>
                        <label className={labelClass}>Work</label>
                        <input type="text" placeholder="Enter work" {...register("lapPropertyWork")} className={getInputClass(errors.lapPropertyWork)} />
                        {errors.lapPropertyWork && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lapPropertyWork.message}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Document List</label>
                        <input type="text" placeholder="Enter document list" {...register("lapPropertyDocumentList")} className={getInputClass(errors.lapPropertyDocumentList)} />
                        {errors.lapPropertyDocumentList && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lapPropertyDocumentList.message}</p>}
                      </div>
                  </>
                )}
              </>
            )}

            {loanTypeValue === "Business Loan" && (
              <div>
                <label className={labelClass}>Business Loan Type</label>
                <select {...register("businessLoanType")} className={getInputClass(errors.businessLoanType)}>
                  <option value="">Select Category</option>
                  <option value="CGTMS">CGTMS</option>
                  <option value="MSME">MSME</option>
                  <option value="Unsecured">Unsecured</option>
                </select>
                {errors.businessLoanType && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.businessLoanType.message}</p>}
              </div>
            )}

              {loanTypeValue === "Business Loan" && businessLoanTypeValue === "Unsecured" && (
                <>
                  <div>
                    <label className={labelClass}>Company Starting Year</label>
                    <input type="text" placeholder="Enter starting year" {...register("businessStartingYear")} className={getInputClass(errors.businessStartingYear)} />
                    {errors.businessStartingYear && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.businessStartingYear.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Type of Work</label>
                    <input type="text" placeholder="Enter type of work" {...register("businessTypeOfWork")} className={getInputClass(errors.businessTypeOfWork)} />
                    {errors.businessTypeOfWork && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.businessTypeOfWork.message}</p>}
                  </div>
                </>
              )}

            {loanTypeValue === "Balance Transfer" && (
              <>
                <div>
                  <label className={labelClass}>Bank Name</label>
                  <input type="text" placeholder="Enter bank name" {...register("btBankName")} className={getInputClass(errors.btBankName)} />
                  {errors.btBankName && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btBankName.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Rate of Interest (%)</label>
                  <input type="number" step="0.01" placeholder="e.g. 8.5" {...register("btRateOfInterest", { min: { value: 0, message: "Value must be positive" } })} className={getInputClass(errors.btRateOfInterest)} />
                  {errors.btRateOfInterest && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btRateOfInterest.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Property Type</label>
                  <input type="text" placeholder="Enter property type" {...register("btPropertyType")} className={getInputClass(errors.btPropertyType)} />
                  {errors.btPropertyType && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btPropertyType.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Market Value</label>
                  <input type="number" placeholder="Enter market value" {...register("btMarketValue", { min: { value: 0, message: "Value must be positive" } })} className={getInputClass(errors.btMarketValue)} />
                  {errors.btMarketValue && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btMarketValue.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Property of Location</label>
                  <input type="text" placeholder="Enter Location" {...register("btLocation")} className={getInputClass(errors.btLocation)} />
                  {errors.btLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btLocation.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Duration</label>
                  <input type="text" placeholder="Enter duration" {...register("btDuration")} className={getInputClass(errors.btDuration)} />
                  {errors.btDuration && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btDuration.message}</p>}
                </div>
                
                <div>
                  <label className={labelClass}>Outstanding</label>
                  <input type="number" placeholder="Enter outstanding" {...register("btOutstanding", { min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.btOutstanding)} />
                  {errors.btOutstanding && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btOutstanding.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Foreclosure Charge</label>
                  <input type="number" placeholder="Enter foreclosure charge" {...register("btForeclosureCharge", { min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.btForeclosureCharge)} />
                  {errors.btForeclosureCharge && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btForeclosureCharge.message}</p>}
                </div>
              </>
            )}



            <div>
              <label className={labelClass}>Interested</label>
              <select {...register("interested", { required: "Interested Status is required" })} className={getInputClass(errors.interested)}>
                <option value="">Select Option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Call Back Later">Call Back Later</option>
              </select>
              {errors.interested && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.interested.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Call Status</label>
              <select {...register("callStatus", { required: "Call Status is required" })} className={getInputClass(errors.callStatus)}>
                <option value="">Select Call Status</option>
                <option value="Connected">Connected</option>
                <option value="Not Picked">Not Picked</option>
                <option value="Busy">Busy</option>
                <option value="Wrong Number">Wrong Number</option>
              </select>
              {errors.callStatus && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.callStatus.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Meeting Date</label>
              <input type="date" {...register("meetingDate")} className={getInputClass(false)} />
            </div>

            <div>
              <label className={labelClass}>Meeting Time</label>
              <input type="time" {...register("meetingTime")} className={getInputClass(false)} />
            </div>
          </div>

          <AnimatePresence>
            {isFollowUp && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="border border-amber-200 bg-amber-50/50 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mt-2">
                  <div className="col-span-full">
                    <p className="text-sm font-bold text-amber-700 flex items-center gap-2">
                      <Clock size={16} /> Schedule Follow-up Details
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>Follow-up Date *</label>
                    <input type="date" {...register("followUpDate", { required: isFollowUp ? "Follow-up Date is required" : false })} className={getInputClass(errors.followUpDate)} />
                    {errors.followUpDate && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.followUpDate.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Follow-up Time *</label>
                    <input type="time" {...register("followUpTime", { required: isFollowUp ? "Follow-up Time is required" : false })} className={getInputClass(errors.followUpTime)} />
                    {errors.followUpTime && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.followUpTime.message}</p>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className={labelClass}>Remarks</label>
            <textarea 
              placeholder="Enter remarks..." 
              {...register("remarks", {
                validate: value => !value || value.trim().split(/\s+/).length <= 200 || "Maximum 200 words allowed"
              })} 
              className={`${getInputClass(errors.remarks)} min-h-[100px] resize-y`} 
            />
            {errors.remarks && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.remarks.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Address {isAllMandatory && "*"}</label>
            <textarea 
              placeholder="Address" 
              {...register("address", {
                required: isAllMandatory ? "Address is required" : false,
                validate: value => !value || value.trim().split(/\s+/).length <= 200 || "Maximum 200 words allowed"
              })} 
              className={`${getInputClass(errors.address)} min-h-[100px] resize-y`} 
            />
            {errors.address && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.address.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#162335] hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-sm uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-4">
            {loading ? "Processing..." : isWrongNumber ? "Mark as Wrong Number" : isFollowUp ? "Save Follow-up Lead" : "Submit New Lead"}
          </button>
        </form>
      </div>
    </div>
  );
}