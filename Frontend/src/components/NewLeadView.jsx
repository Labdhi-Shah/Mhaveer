import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Briefcase, CheckCircle, AlertCircle } from "lucide-react";
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
      loanAmount: "",
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
      unsoldYesNo: false,
      unsoldBV: "",
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
      cibilScore: "",
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
  const loanTypeValue = watch("loanType");
  const lapPropertyTypeValue = watch("lapPropertyType");
  const propertyLoanCategoryValue = watch("propertyLoanCategory");
  const unsoldYesNoValue = watch("unsoldYesNo");
  const naPlotVacantValue = watch("naPlotVacant");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const onSubmitLead = async (data) => {
    setLoading(true);
    try {
      if (data.meetingDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const meetD = new Date(data.meetingDate);
        if (meetD < today) {
          showToast("Meeting date cannot be in the past.", "error");
          setLoading(false);
          return;
        }
      }

      const companyNames = [data.companyName0, data.companyName1].filter(Boolean).map(s => s.trim()).filter(Boolean).join(", ");
      const contactPersons = [data.contactPerson0, data.contactPerson1, data.contactPerson2, data.contactPerson3].filter(Boolean).map(s => s.trim()).filter(Boolean).join(", ");
      const phoneNumbers = [data.phone0, data.phone1, data.phone2, data.phone3].filter(Boolean).map(s => s.trim()).filter(Boolean).join(", ");

      const payload = {
        ...data,
        companyName: companyNames,
        contactPerson: contactPersons,
        phoneNumber: phoneNumbers,
        companyTurnover: data.companyTurnover ? parseFloat(data.companyTurnover) : undefined,
        loanAmount: data.loanAmount ? parseFloat(data.loanAmount) : undefined,
        cibilScore: data.cibilScore ? parseInt(data.cibilScore) : undefined
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
        delete payload.unsoldYesNo;
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
      if (payload.interested !== "Call Back Later") {
        delete payload.followUpDate;
        delete payload.followUpTime;
      } else {
        if (!payload.followUpDate) delete payload.followUpDate;
        if (!payload.followUpTime) delete payload.followUpTime;
      }

      const res = await api.post("/leads", payload);

      if (res.data.success) {
        showToast("Lead saved successfully!", "success");
        reset();
        setActiveCompanyIndex(0);
        setActiveContactIndex(0);
        setActivePhoneIndex(0);
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
    `w-full px-4 py-3 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50 outline-none transition-all duration-200 ${
      hasError 
        ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/50" 
        : "border-slate-200 focus:border-[#162335] focus:ring-2 focus:ring-[#162335]/20 focus:bg-white"
    }`;

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
        <h3 className="text-xl font-bold text-[#162335] border-b border-slate-100 pb-4 mb-8 flex items-center gap-3">
          <Briefcase size={22} className="text-[#9ca3af]" />
          New Loan Lead Entry
        </h3>

        <form onSubmit={handleSubmit(onSubmitLead)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div>
              <label className={labelClass}>Company Name</label>
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
                    {...register(`companyName${idx}`, { required: idx === 0 ? "Primary Company Name is required" : false })} 
                    className={getInputClass(errors[`companyName${idx}`])} 
                  />
                  {errors[`companyName${idx}`] && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors[`companyName${idx}`].message}</p>}
                </div>
              ))}
            </div>

            <div>
              <label className={labelClass}>Contact Person Name</label>
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
                    {...register(`contactPerson${idx}`, { required: idx === 0 ? "Primary Contact Person is required" : false })} 
                    className={getInputClass(errors[`contactPerson${idx}`])} 
                  />
                  {errors[`contactPerson${idx}`] && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors[`contactPerson${idx}`].message}</p>}
                </div>
              ))}
            </div>

            <div>
              <label className={labelClass}>Phone Number</label>
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
              <label className={labelClass}>Company Turnover (INR)</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {['T1', 'T2', 'T3'].map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTurnoverIndex(idx)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                      activeTurnoverIndex === idx 
                        ? "bg-[#162335] text-white border-[#162335] shadow-md" 
                        : errors[idx === 0 ? 'companyTurnover' : `companyTurnover${idx}`]
                          ? "bg-rose-50 text-rose-600 border-rose-300 hover:bg-rose-100"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {['T1', 'T2', 'T3'].map((t, idx) => (
                <div key={idx} className={activeTurnoverIndex === idx ? "block" : "hidden"}>
                  <input 
                    type="number" 
                    placeholder="e.g. 600000" 
                    {...register(idx === 0 ? "companyTurnover" : `companyTurnover${idx}`, { required: idx === 0 ? "Company Turnover is required" : false, min: { value: 1, message: "Turnover must be greater than 0" } })} 
                    className={getInputClass(idx === 0 ? errors.companyTurnover : errors[`companyTurnover${idx}`])} 
                  />
                  {idx === 0 && errors.companyTurnover && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.companyTurnover.message}</p>}
                  {idx !== 0 && errors[`companyTurnover${idx}`] && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors[`companyTurnover${idx}`].message}</p>}
                </div>
              ))}
            </div>

            <div>
              <label className={labelClass}>State</label>
              <input type="text" placeholder="Enter state" {...register("state")} className={getInputClass(false)} />
            </div>

            <div>
              <label className={labelClass}>City</label>
              <input type="text" placeholder="Enter city" {...register("city")} className={getInputClass(false)} />
            </div>

            <div>
              <label className={labelClass}>Loan Amount Required</label>
              <input type="number" placeholder="e.g. 1500000" {...register("loanAmount", { required: "Loan Amount is required", min: { value: 1, message: "Loan Amount must be greater than 0" } })} className={getInputClass(errors.loanAmount)} />
              {errors.loanAmount && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.loanAmount.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Type of Loan</label>
              <select {...register("loanType", { required: "Loan Type is required" })} className={getInputClass(errors.loanType)}>
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
                  <select {...register("propertyPurchaseCategory", { required: "Category is required" })} className={getInputClass(errors.propertyPurchaseCategory)}>
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
                      <input type="text" placeholder="Enter location" {...register("ppLocation", { required: "Location is required" })} className={getInputClass(errors.ppLocation)} />
                      {errors.ppLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.ppLocation.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Market Rate</label>
                      <input type="number" placeholder="Enter market rate" {...register("ppMarketRate", { required: "Market rate is required", min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.ppMarketRate)} />
                      {errors.ppMarketRate && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.ppMarketRate.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Document List Rate</label>
                      <input type="number" placeholder="Enter dastavej rate" {...register("ppDastavejRate", { required: "Dastavej rate is required", min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.ppDastavejRate)} />
                      {errors.ppDastavejRate && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.ppDastavejRate.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Document List Name</label>
                      <input type="text" placeholder="Enter dastavej name" {...register("ppDastavejName", { required: "Dastavej name is required" })} className={getInputClass(errors.ppDastavejName)} />
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
                  <select {...register("propertyLoanCategory", { required: "Property Loan Category is required" })} className={getInputClass(errors.propertyLoanCategory)}>
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
                      <input type="text" placeholder="Enter location" {...register("propertyLocation", { required: "Property Location is required" })} className={getInputClass(errors.propertyLocation)} />
                      {errors.propertyLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.propertyLocation.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Duration of Rent Property</label>
                      <input type="text" placeholder="e.g. 5 Years" {...register("durationOfRentProperty", { required: "Duration is required" })} className={getInputClass(errors.durationOfRentProperty)} />
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
                  <input type="text" placeholder="Enter unit" {...register("unsoldUnit", { required: "Unit is required" })} className={getInputClass(errors.unsoldUnit)} />
                  {errors.unsoldUnit && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.unsoldUnit.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Property Market Value</label>
                  <input type="number" placeholder="Enter M.V" {...register("unsoldMV", { required: "M.V is required", min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.unsoldMV)} />
                  {errors.unsoldMV && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.unsoldMV.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Selection</label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setValue("unsoldYesNo", true, { shouldValidate: true })}
                      className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                        unsoldYesNoValue === true
                          ? "border-[#162335] bg-[#162335]/5 text-[#162335]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Yes
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        unsoldYesNoValue === true
                          ? "border-[#162335] bg-[#162335]"
                          : "border-slate-300"
                      }`}>
                        {unsoldYesNoValue === true && <CheckCircle size={14} className="text-white" />}
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setValue("unsoldYesNo", false, { shouldValidate: true })}
                      className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                        unsoldYesNoValue === false
                          ? "border-[#162335] bg-[#162335]/5 text-[#162335]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      No
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        unsoldYesNoValue === false
                          ? "border-[#162335] bg-[#162335]"
                          : "border-slate-300"
                      }`}>
                        {unsoldYesNoValue === false && <CheckCircle size={14} className="text-white" />}
                      </div>
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>B.U</label>
                  <input type="number" placeholder="Enter B.U" {...register("unsoldBV", { required: "B.U is required", min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.unsoldBV)} />
                  {errors.unsoldBV && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.unsoldBV.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Scheme Name</label>
                  <input type="text" placeholder="Enter scheme" {...register("unsoldScheme", { required: "Scheme Name is required" })} className={getInputClass(errors.unsoldScheme)} />
                  {errors.unsoldScheme && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.unsoldScheme.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Property of Location</label>
                  <input type="text" placeholder="Enter location" {...register("unsoldLocation", { required: "Location is required" })} className={getInputClass(errors.unsoldLocation)} />
                  {errors.unsoldLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.unsoldLocation.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Floor</label>
                  <input type="text" placeholder="Enter floor" {...register("unsoldFloor", { required: "Floor is required" })} className={getInputClass(errors.unsoldFloor)} />
                  {errors.unsoldFloor && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.unsoldFloor.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Document List</label>
                  <input type="text" placeholder="Enter dastavej" {...register("unsoldDastavej", { required: "Dastavej is required" })} className={getInputClass(errors.unsoldDastavej)} />
                  {errors.unsoldDastavej && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.unsoldDastavej.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Partnership</label>
                  <input type="text" placeholder="Enter partnership" {...register("unsoldPartnership", { required: "Partnership is required" })} className={getInputClass(errors.unsoldPartnership)} />
                  {errors.unsoldPartnership && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.unsoldPartnership.message}</p>}
                </div>
              </>
            )}

            {loanTypeValue === "Property Loan" && propertyLoanCategoryValue === "LRD" && (
              <>
                <div>
                  <label className={labelClass}>Rent</label>
                  <input type="number" placeholder="Enter rent" {...register("lrdRent", { required: "Rent is required", min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.lrdRent)} />
                  {errors.lrdRent && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lrdRent.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Market Value</label>
                  <input type="number" placeholder="Enter market value" {...register("lrdMarketValue", { required: "Market Value is required", min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.lrdMarketValue)} />
                  {errors.lrdMarketValue && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lrdMarketValue.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Property of Location</label>
                  <input type="text" placeholder="Enter location" {...register("lrdLocation", { required: "Location is required" })} className={getInputClass(errors.lrdLocation)} />
                  {errors.lrdLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lrdLocation.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>LOI Year</label>
                  <input type="text" placeholder="Enter LOI year" {...register("lrdLoiYear", { required: "LOI Year is required" })} className={getInputClass(errors.lrdLoiYear)} />
                  {errors.lrdLoiYear && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lrdLoiYear.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Scheme Name</label>
                  <input type="text" placeholder="Enter scheme name" {...register("lrdSchemeName", { required: "Scheme Name is required" })} className={getInputClass(errors.lrdSchemeName)} />
                  {errors.lrdSchemeName && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lrdSchemeName.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Document List</label>
                  <input type="text" placeholder="Enter dastavej" {...register("lrdDastavej", { required: "Dastavej is required" })} className={getInputClass(errors.lrdDastavej)} />
                  {errors.lrdDastavej && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lrdDastavej.message}</p>}
                </div>
              </>
            )}

            {loanTypeValue === "Property Loan" && propertyLoanCategoryValue === "NA Plot" && (
              <>
                <div>
                  <label className={labelClass}>Property of Location</label>
                  <input type="text" placeholder="Enter location" {...register("naPlotLocation", { required: "Location is required" })} className={getInputClass(errors.naPlotLocation)} />
                  {errors.naPlotLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotLocation.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Property Market Value</label>
                  <input type="number" placeholder="Enter M.V" {...register("naPlotMV", { required: "Property Market Value is required", min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.naPlotMV)} />
                  {errors.naPlotMV && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotMV.message}</p>}
                </div>
                <div className="hidden">
                  <input type="checkbox" id="naPlotYesNo" {...register("naPlotYesNo")} />
                </div>
                <div>
                  <label className={labelClass}>Document List</label>
                  <input type="text" placeholder="Enter dastavej" {...register("naPlotDastavej", { required: "Dastavej is required" })} className={getInputClass(errors.naPlotDastavej)} />
                  {errors.naPlotDastavej && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotDastavej.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>VAR</label>
                  <input type="text" placeholder="Enter VAR" {...register("naPlotVAR", { required: "VAR is required" })} className={getInputClass(errors.naPlotVAR)} />
                  {errors.naPlotVAR && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotVAR.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Scheme Name</label>
                  <input type="text" placeholder="Enter scheme" {...register("naPlotScheme", { required: "Scheme Name is required" })} className={getInputClass(errors.naPlotScheme)} />
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
                  <select {...register("lapPropertyType", { required: "Property Type is required" })} className={getInputClass(errors.lapPropertyType)}>
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
                      <input type="text" placeholder="Enter location" {...register("lapPropertyLocation", { required: "Location is required" })} className={getInputClass(errors.lapPropertyLocation)} />
                      {errors.lapPropertyLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lapPropertyLocation.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Property Market Value</label>
                      <input type="number" placeholder="Enter market value" {...register("lapPropertyMarketValue", { required: "Market value is required", min: { value: 1, message: "Value must be positive" } })} className={getInputClass(errors.lapPropertyMarketValue)} />
                      {errors.lapPropertyMarketValue && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lapPropertyMarketValue.message}</p>}
                    </div>
                      <div>
                        <label className={labelClass}>Work</label>
                        <input type="text" placeholder="Enter work" {...register("lapPropertyWork", { required: "Work is required" })} className={getInputClass(errors.lapPropertyWork)} />
                        {errors.lapPropertyWork && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lapPropertyWork.message}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Document List</label>
                        <input type="text" placeholder="Enter document list" {...register("lapPropertyDocumentList", { required: "Document List is required" })} className={getInputClass(errors.lapPropertyDocumentList)} />
                        {errors.lapPropertyDocumentList && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lapPropertyDocumentList.message}</p>}
                      </div>
                  </>
                )}
              </>
            )}

            {loanTypeValue === "Business Loan" && (
              <div>
                <label className={labelClass}>Business Loan Type</label>
                <select {...register("businessLoanType", { required: "Business Loan Type is required" })} className={getInputClass(errors.businessLoanType)}>
                  <option value="">Select Category</option>
                  <option value="CGTMS">CGTMS</option>
                  <option value="MSME">MSME</option>
                  <option value="Unsecured">Unsecured</option>
                </select>
                {errors.businessLoanType && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.businessLoanType.message}</p>}
              </div>
            )}

            {loanTypeValue === "Balance Transfer" && (
              <>
                <div>
                  <label className={labelClass}>Bank Name</label>
                  <input type="text" placeholder="Enter bank name" {...register("btBankName", { required: "Bank Name is required" })} className={getInputClass(errors.btBankName)} />
                  {errors.btBankName && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btBankName.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Rate of Interest (%)</label>
                  <input type="number" step="0.01" placeholder="e.g. 8.5" {...register("btRateOfInterest", { required: "Rate of Interest is required", min: { value: 0, message: "Value must be positive" } })} className={getInputClass(errors.btRateOfInterest)} />
                  {errors.btRateOfInterest && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btRateOfInterest.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Property Type</label>
                  <input type="text" placeholder="Enter property type" {...register("btPropertyType", { required: "Property Type is required" })} className={getInputClass(errors.btPropertyType)} />
                  {errors.btPropertyType && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btPropertyType.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Market Value</label>
                  <input type="number" placeholder="Enter market value" {...register("btMarketValue", { required: "Market value is required", min: { value: 1, message: "Value must be positive" } })} className={getInputClass(errors.btMarketValue)} />
                  {errors.btMarketValue && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btMarketValue.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Property of Location</label>
                  <input type="text" placeholder="Enter Location" {...register("btLocation", { required: "Location is required" })} className={getInputClass(errors.btLocation)} />
                  {errors.btLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btLocation.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Duration</label>
                  <input type="text" placeholder="Enter duration" {...register("btDuration", { required: "Duration is required" })} className={getInputClass(errors.btDuration)} />
                  {errors.btDuration && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btDuration.message}</p>}
                </div>
                
                <div>
                  <label className={labelClass}>Outstanding</label>
                  <input type="number" placeholder="Enter outstanding" {...register("btOutstanding", { required: "Outstanding is required", min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.btOutstanding)} />
                  {errors.btOutstanding && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btOutstanding.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Foreclosure Charge</label>
                  <input type="number" placeholder="Enter foreclosure charge" {...register("btForeclosureCharge", { required: "Foreclosure Charge is required", min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.btForeclosureCharge)} />
                  {errors.btForeclosureCharge && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btForeclosureCharge.message}</p>}
                </div>
              </>
            )}

            <div>
              <label className={labelClass}>CIBIL Score</label>
              <input type="number" placeholder="700 - 900" {...register("cibilScore", { min: { value: 700, message: "Min score is 700" }, max: { value: 900, message: "Max score is 900" } })} className={getInputClass(errors.cibilScore)} />
              {errors.cibilScore && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.cibilScore.message}</p>}
            </div>

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
            {interestedValue === "Call Back Later" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="border border-amber-200 bg-amber-50/50 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mt-2">
                  <div className="col-span-full">
                    <p className="text-sm font-bold text-amber-700 flex items-center gap-2">
                      <Clock size={16} /> Schedule Follow-up Details
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>Follow-up Date</label>
                    <input type="date" {...register("followUpDate", { required: "Follow-up Date is required" })} className={getInputClass(errors.followUpDate)} />
                    {errors.followUpDate && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.followUpDate.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Follow-up Time</label>
                    <input type="time" {...register("followUpTime", { required: "Follow-up Time is required" })} className={getInputClass(errors.followUpTime)} />
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
            <label className={labelClass}>Address</label>
            <textarea 
              placeholder="Address" 
              {...register("address", {
                validate: value => !value || value.trim().split(/\s+/).length <= 200 || "Maximum 200 words allowed"
              })} 
              className={`${getInputClass(errors.address)} min-h-[100px] resize-y`} 
            />
            {errors.address && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.address.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#9ca3af] hover:bg-[#c39e2d] text-[#162335] font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-sm uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-4">
            {loading ? "Processing..." : "Submit New Lead"}
          </button>
        </form>
      </div>
    </div>
  );
}