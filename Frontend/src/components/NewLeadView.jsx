import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Briefcase, CheckCircle, AlertCircle } from "lucide-react";
import api from "../api";

export default function NewLeadView() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const { 
    register, 
    handleSubmit, 
    watch, 
    reset, 
    formState: { errors } 
  } = useForm({
    defaultValues: {
      companyName: "",
      contactPerson: "",
      phone: "",
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

      const payload = {
        ...data,
        phoneNumber: data.phone,
        companyTurnover: data.companyTurnover ? parseFloat(data.companyTurnover) : undefined,
        loanAmount: data.loanAmount ? parseFloat(data.loanAmount) : undefined,
        cibilScore: data.cibilScore ? parseInt(data.cibilScore) : undefined
      };
      
      delete payload.phone;

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
      }
    } catch (error) {
      console.error("Error saving lead:", error);
      showToast(error.response?.data?.message || "Failed to save lead.", "error");
    } finally {
      setLoading(false);
    }
  };

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

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-black text-[#0a2540] border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
          <Briefcase size={20} className="text-[#d4af37]" />
          New Loan Lead Entry
        </h3>

        <form onSubmit={handleSubmit(onSubmitLead)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Company Name *</label>
              <input type="text" placeholder="Enter company name" {...register("companyName", { required: "Company Name is required" })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${errors.companyName ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} />
              {errors.companyName && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.companyName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Contact Person Name *</label>
              <input type="text" placeholder="Enter full name" {...register("contactPerson", { required: "Contact Person Name is required" })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${errors.contactPerson ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} />
              {errors.contactPerson && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.contactPerson.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Phone Number *</label>
              <input type="tel" placeholder="10-digit mobile number" {...register("phone", { required: "Phone is required", pattern: { value: /^[6-9]\d{9}$/, message: "Indian mobile only (10 digits starting with 6-9)" }})} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${errors.phone ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} />
              {errors.phone && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">City</label>
              <input type="text" placeholder="Enter city" {...register("city")} className="w-full px-4 py-2.5 border border-slate-200 focus:border-[#0a2540] rounded-xl text-xs outline-none transition" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">State</label>
              <input type="text" placeholder="Enter state" {...register("state")} className="w-full px-4 py-2.5 border border-slate-200 focus:border-[#0a2540] rounded-xl text-xs outline-none transition" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Company Turnover (INR) *</label>
              <input type="number" placeholder="e.g. 600000" {...register("companyTurnover", { required: "Company Turnover is required", min: { value: 1, message: "Turnover must be greater than 0" } })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${errors.companyTurnover ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} />
              {errors.companyTurnover && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.companyTurnover.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Loan Amount Required *</label>
              <input type="number" placeholder="e.g. 1500000" {...register("loanAmount", { required: "Loan Amount is required", min: { value: 1, message: "Loan Amount must be greater than 0" } })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${errors.loanAmount ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} />
              {errors.loanAmount && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.loanAmount.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Type of Loan *</label>
              <select {...register("loanType", { required: "Loan Type is required" })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none bg-white transition ${errors.loanType ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`}>
                <option value="">Select Loan Type</option>
                <option value="Home Loan">Home Loan</option>
                <option value="Business Loan">Business Loan</option>
                <option value="Property Loan">Property Loan</option>
                <option value="Balance Transfer">Balance Transfer</option>
              </select>
              {errors.loanType && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.loanType.message}</p>}
            </div>

            {loanTypeValue === "Home Loan" && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Home Loan Type *</label>
                <select {...register("homeLoanType", { required: "Home Loan Type is required" })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none bg-white transition ${errors.homeLoanType ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`}>
                  <option value="">Select Category</option>
                  <option value="Home Purchase">Home Purchase</option>
                  <option value="Existing Home">Existing Home</option>
                </select>
                {errors.homeLoanType && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.homeLoanType.message}</p>}
              </div>
            )}

            {loanTypeValue === "Property Loan" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Property Loan Category *</label>
                  <select {...register("propertyLoanCategory", { required: "Property Loan Category is required" })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none bg-white transition ${errors.propertyLoanCategory ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`}>
                    <option value="">Select Category</option>
                    <option value="Working Capital">Working Capital</option>
                    <option value="Plot Loan">Plot Loan</option>
                    <option value="Lease Rental Discounting">Lease Rental Discounting</option>
                    <option value="LAP">LAP</option>
                  </select>
                  {errors.propertyLoanCategory && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.propertyLoanCategory.message}</p>}
                </div>
                {propertyLoanCategoryValue !== "LAP" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Property Location *</label>
                      <input type="text" placeholder="Enter location" {...register("propertyLocation", { required: "Property Location is required" })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${errors.propertyLocation ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} />
                      {errors.propertyLocation && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.propertyLocation.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Duration of Rent Property *</label>
                      <input type="text" placeholder="e.g. 5 Years" {...register("durationOfRentProperty", { required: "Duration is required" })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${errors.durationOfRentProperty ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} />
                      {errors.durationOfRentProperty && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.durationOfRentProperty.message}</p>}
                    </div>
                  </>
                )}
              </>
            )}

            {loanTypeValue === "Property Loan" && propertyLoanCategoryValue === "LAP" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Property Type *</label>
                  <select {...register("lapPropertyType", { required: "Property Type is required" })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none bg-white transition ${errors.lapPropertyType ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`}>
                    <option value="">Select Property Type</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Residential">Residential</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                  {errors.lapPropertyType && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.lapPropertyType.message}</p>}
                </div>
                {lapPropertyTypeValue && ["Residential", "Commercial", "Industrial"].includes(lapPropertyTypeValue) && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Property Location *</label>
                      <input type="text" placeholder="Enter location" {...register("lapPropertyLocation", { required: "Location is required" })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${errors.lapPropertyLocation ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} />
                      {errors.lapPropertyLocation && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.lapPropertyLocation.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Property Market Value *</label>
                      <input type="number" placeholder="Enter market value" {...register("lapPropertyMarketValue", { required: "Market value is required", min: { value: 1, message: "Value must be positive" } })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${errors.lapPropertyMarketValue ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} />
                      {errors.lapPropertyMarketValue && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.lapPropertyMarketValue.message}</p>}
                    </div>
                  </>
                )}
              </>
            )}

            {loanTypeValue === "Business Loan" && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Business Loan Type *</label>
                <select {...register("businessLoanType", { required: "Business Loan Type is required" })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none bg-white transition ${errors.businessLoanType ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`}>
                  <option value="">Select Category</option>
                  <option value="CGTMS">CGTMS</option>
                  <option value="MSME">MSME</option>
                  <option value="Unsecured">Unsecured</option>
                </select>
                {errors.businessLoanType && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.businessLoanType.message}</p>}
              </div>
            )}

            {loanTypeValue === "Balance Transfer" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Bank Name *</label>
                  <input type="text" placeholder="Enter bank name" {...register("btBankName", { required: "Bank Name is required" })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${errors.btBankName ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} />
                  {errors.btBankName && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.btBankName.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Rate of Interest (%) *</label>
                  <input type="number" step="0.01" placeholder="e.g. 8.5" {...register("btRateOfInterest", { required: "Rate of Interest is required", min: { value: 0, message: "Value must be positive" } })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${errors.btRateOfInterest ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} />
                  {errors.btRateOfInterest && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.btRateOfInterest.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Property Type *</label>
                  <input type="text" placeholder="Enter property type" {...register("btPropertyType", { required: "Property Type is required" })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${errors.btPropertyType ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} />
                  {errors.btPropertyType && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.btPropertyType.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Market Value *</label>
                  <input type="number" placeholder="Enter market value" {...register("btMarketValue", { required: "Market value is required", min: { value: 1, message: "Value must be positive" } })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${errors.btMarketValue ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} />
                  {errors.btMarketValue && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.btMarketValue.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Location *</label>
                  <input type="text" placeholder="Enter location" {...register("btLocation", { required: "Location is required" })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${errors.btLocation ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} />
                  {errors.btLocation && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.btLocation.message}</p>}
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">CIBIL Score</label>
              <input type="number" placeholder="700 - 900" {...register("cibilScore", { min: { value: 700, message: "Min score is 700" }, max: { value: 900, message: "Max score is 900" } })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${errors.cibilScore ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} />
              {errors.cibilScore && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.cibilScore.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Interested *</label>
              <select {...register("interested", { required: "Interested Status is required" })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none bg-white transition ${errors.interested ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`}>
                <option value="">Select Option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Call Back Later">Call Back Later</option>
              </select>
              {errors.interested && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.interested.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Call Status *</label>
              <select {...register("callStatus", { required: "Call Status is required" })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none bg-white transition ${errors.callStatus ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`}>
                <option value="">Select Call Status</option>
                <option value="Connected">Connected</option>
                <option value="Not Picked">Not Picked</option>
                <option value="Busy">Busy</option>
                <option value="Wrong Number">Wrong Number</option>
              </select>
              {errors.callStatus && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.callStatus.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Meeting Date</label>
              <input type="date" {...register("meetingDate")} className="w-full px-4 py-2.5 border border-slate-200 focus:border-[#0a2540] rounded-xl text-xs outline-none transition bg-white" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Meeting Time</label>
              <input type="time" {...register("meetingTime")} className="w-full px-4 py-2.5 border border-slate-200 focus:border-[#0a2540] rounded-xl text-xs outline-none transition bg-white" />
            </div>
          </div>

          <AnimatePresence>
            {interestedValue === "Call Back Later" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border border-amber-200 bg-amber-50/50 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <p className="text-xs font-bold text-[#d4af37] flex items-center gap-1.5">
                    <Clock size={14} /> Schedule Follow-up Details
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Follow-up Date *</label>
                  <input type="date" {...register("followUpDate", { required: "Follow-up Date is required" })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none bg-white transition ${errors.followUpDate ? "border-rose-400 focus:border-rose-500" : "border-amber-300 focus:border-[#0a2540]"}`} />
                  {errors.followUpDate && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.followUpDate.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Follow-up Time *</label>
                  <input type="time" {...register("followUpTime", { required: "Follow-up Time is required" })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none bg-white transition ${errors.followUpTime ? "border-rose-400 focus:border-rose-500" : "border-amber-300 focus:border-[#0a2540]"}`} />
                  {errors.followUpTime && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.followUpTime.message}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Remarks</label>
            <textarea 
              placeholder="Enter remarks..." 
              {...register("remarks", {
                validate: value => !value || value.trim().split(/\s+/).length <= 200 || "Maximum 200 words allowed"
              })} 
              className={`w-full px-4 py-3 border rounded-xl text-xs outline-none transition min-h-[80px] resize-y ${errors.remarks ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} 
            />
            {errors.remarks && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.remarks.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Address</label>
            <textarea 
              placeholder="Address" 
              {...register("address", {
                validate: value => !value || value.trim().split(/\s+/).length <= 200 || "Maximum 200 words allowed"
              })} 
              className={`w-full px-4 py-3 border rounded-xl text-xs outline-none transition min-h-[80px] resize-y ${errors.address ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} 
            />
            {errors.address && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.address.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#d4af37] hover:bg-[#c39e2d] text-[#0a2540] font-black py-3.5 rounded-xl shadow-md transition-all text-xs uppercase tracking-widest disabled:opacity-70">
            {loading ? "Processing..." : "Submit New Lead"}
          </button>
        </form>
      </div>
    </div>
  );
}