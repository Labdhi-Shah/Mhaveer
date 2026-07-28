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
      yearlyIncome: "",
      loanAmount: "",
      loanType: "",
      cibilScore: "",
      interested: "",
      callStatus: "",
      meetingDate: "",
      meetingTime: "",
      remarks: "",
      followUpDate: "",
      followUpTime: ""
    }
  });

  const interestedValue = watch("interested");

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
        yearlyIncome: data.yearlyIncome ? parseFloat(data.yearlyIncome) : undefined,
        loanAmount: data.loanAmount ? parseFloat(data.loanAmount) : undefined,
        cibilScore: data.cibilScore ? parseInt(data.cibilScore) : undefined
      };

      if (!payload.meetingDate) delete payload.meetingDate;
      if (!payload.meetingTime) delete payload.meetingTime;
      if (!payload.followUpDate) delete payload.followUpDate;
      if (!payload.followUpTime) delete payload.followUpTime;

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
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Yearly Income (INR) *</label>
              <input type="number" placeholder="e.g. 600000" {...register("yearlyIncome", { required: "Yearly Income is required", min: { value: 1, message: "Income must be greater than 0" } })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${errors.yearlyIncome ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} />
              {errors.yearlyIncome && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.yearlyIncome.message}</p>}
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
                <option value="Personal Loan">Personal Loan</option>
                <option value="Home Loan">Home Loan</option>
                <option value="Business Loan">Business Loan</option>
                <option value="Car Loan">Car Loan</option>
                <option value="Gold Loan">Gold Loan</option>
                <option value="Education Loan">Education Loan</option>
              </select>
              {errors.loanType && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.loanType.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">CIBIL Score *</label>
              <input type="number" placeholder="300 - 900" {...register("cibilScore", { required: "CIBIL Score is required", min: { value: 300, message: "Min score is 300" }, max: { value: 900, message: "Max score is 900" } })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${errors.cibilScore ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#0a2540]"}`} />
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
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Internal Remarks</label>
            <textarea placeholder="Any additional notes..." {...register("remarks")} className="w-full px-4 py-3 border border-slate-200 focus:border-[#0a2540] rounded-xl text-xs outline-none transition min-h-[80px] resize-y" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#d4af37] hover:bg-[#c39e2d] text-[#0a2540] font-black py-3.5 rounded-xl shadow-md transition-all text-xs uppercase tracking-widest disabled:opacity-70">
            {loading ? "Processing..." : "Submit New Lead"}
          </button>
        </form>
      </div>
    </div>
  );
}
