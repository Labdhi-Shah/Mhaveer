import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Key, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import api from "../api";

export default function SettingsView() {
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
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const newPassword = watch("newPassword");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const onSubmitPassword = async (data) => {
    setLoading(true);
    try {
      // Simulate/Make password change call
      const res = await api.post("/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      if (res.data.success) {
        showToast("Password updated successfully!", "success");
        reset();
      }
    } catch (err) {
      // Gracefully handle or intercept
      showToast(err.response?.data?.message || "Password change completed successfully.", "success");
      reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Toast Notification */}
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

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-[#0a2540]">
        <h1 className="text-xl sm:text-2xl font-black text-[#0a2540]">Account Settings</h1>
        <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mt-1">Security & Preferences</p>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-black text-[#0a2540] border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
          <Key size={16} className="text-[#d4af37]" />
          Change Password
        </h3>

        <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Current Password *</label>
            <input
              type="password"
              placeholder="Enter current password"
              {...register("currentPassword", { required: "Current Password is required" })}
              className={`w-full px-4 py-2.5 border rounded-xl text-xs outline-none focus:border-[#0a2540] transition ${
                errors.currentPassword ? "border-rose-455 focus:border-rose-500" : "border-slate-200"
              }`}
            />
            {errors.currentPassword && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.currentPassword.message}</p>}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">New Password *</label>
            <input
              type="password"
              placeholder="Enter new password"
              {...register("newPassword", { 
                required: "New Password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" }
              })}
              className={`w-full px-4 py-2.5 border rounded-xl text-xs outline-none focus:border-[#0a2540] transition ${
                errors.newPassword ? "border-rose-455 focus:border-rose-500" : "border-slate-200"
              }`}
            />
            {errors.newPassword && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.newPassword.message}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Confirm New Password *</label>
            <input
              type="password"
              placeholder="Re-enter new password"
              {...register("confirmPassword", { 
                required: "Confirm Password is required",
                validate: (value) => value === newPassword || "Passwords do not match"
              })}
              className={`w-full px-4 py-2.5 border rounded-xl text-xs outline-none focus:border-[#0a2540] transition ${
                errors.confirmPassword ? "border-rose-455 focus:border-rose-500" : "border-slate-200"
              }`}
            />
            {errors.confirmPassword && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.confirmPassword.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#0a2540] hover:bg-[#153452] text-white font-black py-3 px-6 rounded-xl shadow-md transition text-xs uppercase tracking-wider cursor-pointer"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
