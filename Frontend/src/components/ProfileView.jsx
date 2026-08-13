import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Phone, Mail, MapPin, Calendar, Shield, Award, Loader2 } from "lucide-react";
import api from "../api";

export default function ProfileView() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.fullName) return;
      try {
        setLoading(true);
        // Query employee list by searching name
        const res = await api.get(`/employees?search=${encodeURIComponent(user.fullName)}`);
        if (res.data.success && res.data.data.length > 0) {
          // Find the exact match
          const match = res.data.data.find(
            (emp) => emp.fullName.toLowerCase() === user.fullName.toLowerCase()
          );
          setProfile(match || res.data.data[0]);
        }
      } catch (err) {
        console.error("Error fetching employee profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Fallback defaults if search doesn't return data
  const displayName = user?.fullName || "Employee Portal User";
  const displayRole = user?.role || "Front Desk Representative";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-[#0a2540]">
        <h1 className="text-xl sm:text-2xl font-black text-[#0a2540]">My Profile</h1>
        <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mt-1">Official Credentials & Settings</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-[#0a2540]" size={32} />
          <p className="text-[10px] text-slate-400 font-bold uppercase">Loading profile...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel: Profile Badge */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-3xl bg-[#0a2540] border-4 border-[#d4af37] text-white flex items-center justify-center text-3xl font-black shadow-md">
              {displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-black text-[#0a2540]">{displayName}</h2>
              <p className="text-xs font-bold text-[#d4af37] uppercase mt-0.5">{displayRole}</p>
            </div>
            <div className="w-full border-t border-slate-100 pt-4 flex justify-around text-center">
              <div>
                <p className="text-[9px] font-extrabold text-slate-400 uppercase">Employee ID</p>
                <p className="font-mono text-xs font-black text-[#0a2540] mt-0.5">
                  {profile?.employeeId || "EMP-2026-M04"}
                </p>
              </div>
              <div className="w-px bg-slate-150 h-8 self-center" />
              <div>
                <p className="text-[9px] font-extrabold text-slate-400 uppercase">Status</p>
                <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-full mt-1">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel: Complete Profile details */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-black text-[#0a2540] border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Shield size={16} className="text-[#d4af37]" />
              Employment Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-slate-700">
              <div className="space-y-1">
                <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Official Email Address</p>
                <p className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Mail size={14} className="text-slate-400" />
                  {profile?.email || "employee@mhaveer.com"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Personal Email Address</p>
                <p className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Mail size={14} className="text-slate-400" />
                  {profile?.personalEmail || "personal@gmail.com"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Mobile Number</p>
                <p className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Phone size={14} className="text-slate-400" />
                  {profile?.phone || "+91 9876543210"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Assigned Branch</p>
                <p className="font-bold text-slate-850 flex items-center gap-1.5 mt-0.5">
                  <Award size={14} className="text-slate-400" />
                  Main Corporate Office
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Joining Date</p>
                <p className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Calendar size={14} className="text-slate-400" />
                  {profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString("en-IN") : "20-Apr-2026"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Date of Birth</p>
                <p className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Calendar size={14} className="text-slate-400" />
                  {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString("en-IN") : "15-Aug-1995"}
                </p>
              </div>

              <div className="col-span-full space-y-1 border-t border-slate-100 pt-4 mt-2">
                <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Permanent Address</p>
                <p className="font-semibold text-slate-700 flex items-start gap-1.5 mt-1 leading-relaxed">
                  <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  {profile?.address || "Mhaveer Fincap Corporate Branch, Gujarat, India"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}