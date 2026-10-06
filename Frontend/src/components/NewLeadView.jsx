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

  const { 
    register, 
    handleSubmit, 
    watch, 
    reset, 
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
      homeLoanType: "",
      propertyLocation: "",
      durationOfRentProperty: "",
      lapPropertyType: "",
      lapPropertyLocation: "",
      lapPropertyMarketValue: "",
      businessLoanType: "",
      btBankName: "",
      btRateOfInterest: "",
      btPropertyType: "",
      btMarketValue: "",
      btLocation: "",
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

      if (payload.loanType !== "Home Loan") {
        delete payload.homeLoanType;
      }
      if (payload.loanType !== "Property Loan") {
        delete payload.propertyLoanCategory;
        delete payload.propertyLocation;
        delete payload.durationOfRentProperty;
      } else if (payload.propertyLoanCategory === "LAP") {
        delete payload.propertyLocation;
        delete payload.durationOfRentProperty;
      }
      if (payload.propertyLoanCategory !== "LAP") {
        delete payload.lapPropertyType;
        delete payload.lapPropertyLocation;
        delete payload.lapPropertyMarketValue;
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
        : "border-slate-200 focus:border-[#0a2540] focus:ring-2 focus:ring-[#0a2540]/20 focus:bg-white"
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
        <h3 className="text-xl font-bold text-[#0a2540] border-b border-slate-100 pb-4 mb-8 flex items-center gap-3">
          <Briefcase size={22} className="text-[#d4af37]" />
          New Loan Lead Entry
        </h3>

        <form onSubmit={handleSubmit(onSubmitLead)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div>
              <label className={labelClass}>Company Name *</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {[0, 1].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveCompanyIndex(idx)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                      activeCompanyIndex === idx 
                        ? "bg-[#0a2540] text-white border-[#0a2540] shadow-md" 
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
              <label className={labelClass}>Contact Person Name *</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {[0, 1, 2, 3].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveContactIndex(idx)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                      activeContactIndex === idx 
                        ? "bg-[#0a2540] text-white border-[#0a2540] shadow-md" 
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
              <label className={labelClass}>Phone Number *</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {[0, 1, 2, 3].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhoneIndex(idx)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                      activePhoneIndex === idx 
                        ? "bg-[#0a2540] text-white border-[#0a2540] shadow-md" 
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
              <label className={labelClass}>City</label>
              <input type="text" placeholder="Enter city" {...register("city")} className={getInputClass(false)} />
            </div>

            <div>
              <label className={labelClass}>State</label>
              <input type="text" placeholder="Enter state" {...register("state")} className={getInputClass(false)} />
            </div>

            <div>
              <label className={labelClass}>Company Turnover (INR) *</label>
              <input type="number" placeholder="e.g. 600000" {...register("companyTurnover", { required: "Company Turnover is required", min: { value: 1, message: "Turnover must be greater than 0" } })} className={getInputClass(errors.companyTurnover)} />
              {errors.companyTurnover && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.companyTurnover.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Loan Amount Required *</label>
              <input type="number" placeholder="e.g. 1500000" {...register("loanAmount", { required: "Loan Amount is required", min: { value: 1, message: "Loan Amount must be greater than 0" } })} className={getInputClass(errors.loanAmount)} />
              {errors.loanAmount && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.loanAmount.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Type of Loan *</label>
              <select {...register("loanType", { required: "Loan Type is required" })} className={getInputClass(errors.loanType)}>
                <option value="">Select Loan Type</option>
                <option value="Home Loan">Home Loan</option>
                <option value="Business Loan">Business Loan</option>
                <option value="Property Loan">Property Loan</option>
                <option value="Balance Transfer">Balance Transfer</option>
              </select>
              {errors.loanType && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.loanType.message}</p>}
            </div>

            {loanTypeValue === "Home Loan" && (
              <div>
                <label className={labelClass}>Home Loan Type *</label>
                <select {...register("homeLoanType", { required: "Home Loan Type is required" })} className={getInputClass(errors.homeLoanType)}>
                  <option value="">Select Category</option>
                  <option value="Home Purchase">Home Purchase</option>
                  <option value="Existing Home">Existing Home</option>
                </select>
                {errors.homeLoanType && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.homeLoanType.message}</p>}
              </div>
            )}

            {loanTypeValue === "Property Loan" && (
              <>
                <div>
                  <label className={labelClass}>Property Loan Category *</label>
                  <select {...register("propertyLoanCategory", { required: "Property Loan Category is required" })} className={getInputClass(errors.propertyLoanCategory)}>
                    <option value="">Select Category</option>
                    <option value="Working Capital">Working Capital</option>
                    <option value="Plot Loan">Plot Loan</option>
                    <option value="Lease Rental Discounting">Lease Rental Discounting</option>
                    <option value="LAP">LAP</option>
                  </select>
                  {errors.propertyLoanCategory && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.propertyLoanCategory.message}</p>}
                </div>
                {propertyLoanCategoryValue !== "LAP" && (
                  <>
                    <div>
                      <label className={labelClass}>Property Location *</label>
                      <input type="text" placeholder="Enter location" {...register("propertyLocation", { required: "Property Location is required" })} className={getInputClass(errors.propertyLocation)} />
                      {errors.propertyLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.propertyLocation.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Duration of Rent Property *</label>
                      <input type="text" placeholder="e.g. 5 Years" {...register("durationOfRentProperty", { required: "Duration is required" })} className={getInputClass(errors.durationOfRentProperty)} />
                      {errors.durationOfRentProperty && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.durationOfRentProperty.message}</p>}
                    </div>
                  </>
                )}
              </>
            )}

            {loanTypeValue === "Property Loan" && propertyLoanCategoryValue === "LAP" && (
              <>
                <div>
                  <label className={labelClass}>Property Type *</label>
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
                      <label className={labelClass}>Property Location *</label>
                      <input type="text" placeholder="Enter location" {...register("lapPropertyLocation", { required: "Location is required" })} className={getInputClass(errors.lapPropertyLocation)} />
                      {errors.lapPropertyLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lapPropertyLocation.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Property Market Value *</label>
                      <input type="number" placeholder="Enter market value" {...register("lapPropertyMarketValue", { required: "Market value is required", min: { value: 1, message: "Value must be positive" } })} className={getInputClass(errors.lapPropertyMarketValue)} />
                      {errors.lapPropertyMarketValue && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lapPropertyMarketValue.message}</p>}
                    </div>
                  </>
                )}
              </>
            )}

            {loanTypeValue === "Business Loan" && (
              <div>
                <label className={labelClass}>Business Loan Type *</label>
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
                  <label className={labelClass}>Bank Name *</label>
                  <input type="text" placeholder="Enter bank name" {...register("btBankName", { required: "Bank Name is required" })} className={getInputClass(errors.btBankName)} />
                  {errors.btBankName && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btBankName.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Rate of Interest (%) *</label>
                  <input type="number" step="0.01" placeholder="e.g. 8.5" {...register("btRateOfInterest", { required: "Rate of Interest is required", min: { value: 0, message: "Value must be positive" } })} className={getInputClass(errors.btRateOfInterest)} />
                  {errors.btRateOfInterest && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btRateOfInterest.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Property Type *</label>
                  <input type="text" placeholder="Enter property type" {...register("btPropertyType", { required: "Property Type is required" })} className={getInputClass(errors.btPropertyType)} />
                  {errors.btPropertyType && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btPropertyType.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Market Value *</label>
                  <input type="number" placeholder="Enter market value" {...register("btMarketValue", { required: "Market value is required", min: { value: 1, message: "Value must be positive" } })} className={getInputClass(errors.btMarketValue)} />
                  {errors.btMarketValue && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btMarketValue.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Location *</label>
                  <input type="text" placeholder="Enter location" {...register("btLocation", { required: "Location is required" })} className={getInputClass(errors.btLocation)} />
                  {errors.btLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btLocation.message}</p>}
                </div>
              </>
            )}

            <div>
              <label className={labelClass}>CIBIL Score</label>
              <input type="number" placeholder="700 - 900" {...register("cibilScore", { min: { value: 700, message: "Min score is 700" }, max: { value: 900, message: "Max score is 900" } })} className={getInputClass(errors.cibilScore)} />
              {errors.cibilScore && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.cibilScore.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Interested *</label>
              <select {...register("interested", { required: "Interested Status is required" })} className={getInputClass(errors.interested)}>
                <option value="">Select Option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Call Back Later">Call Back Later</option>
              </select>
              {errors.interested && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.interested.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Call Status *</label>
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
                    <label className={labelClass}>Follow-up Date *</label>
                    <input type="date" {...register("followUpDate", { required: "Follow-up Date is required" })} className={getInputClass(errors.followUpDate)} />
                    {errors.followUpDate && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.followUpDate.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Follow-up Time *</label>
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

          <button type="submit" disabled={loading} className="w-full bg-[#d4af37] hover:bg-[#c39e2d] text-[#0a2540] font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-sm uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-4">
            {loading ? "Processing..." : "Submit New Lead"}
          </button>
        </form>
      </div>
    </div>
  );
}