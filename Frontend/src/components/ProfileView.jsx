import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Phone, Mail, MapPin, Calendar, Shield, Award, Loader2 } from "lucide-react";
import api from "../api";

const formatDisplayDate = (val) => {
  if (!val) return "-";
  try {
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (!trimmed) return "-";
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const parts = trimmed.split("T")[0].split("-");
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month >= 1 && month <= 12) {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
        }
      }
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return "-";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(d.getDate()).padStart(2, "0");
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return "-";
  }
};

export default function ProfileView() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const empId = user?.id || user?._id;
      try {
        setLoading(true);
        // Priority 1: Fetch employee directly by ID so full fields (joiningDate, dob) are loaded
        if (empId) {
          try {
            const directRes = await api.get(`/employees/${empId}`);
            if (directRes.data?.success && directRes.data?.data) {
              setProfile(directRes.data.data);
              return;
            }
          } catch (e) {
            console.warn("Direct fetch by ID failed, falling back to search:", e);
          }
        }

        // Priority 2: Fallback search by employeeId, email, or fullName
        const searchParam = user?.employeeId || user?.officialEmail || user?.email || user?.fullName || user?.name;
        if (searchParam) {
          const res = await api.get(`/employees?search=${encodeURIComponent(searchParam)}`);
          if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
            const match = res.data.data.find(
              (emp) =>
                (user?.employeeId && emp.employeeId?.toUpperCase() === user.employeeId?.toUpperCase()) ||
                (user?.officialEmail && emp.officialEmail?.toLowerCase() === user.officialEmail?.toLowerCase()) ||
                (user?.email && (emp.officialEmail?.toLowerCase() === user.email?.toLowerCase() || emp.personalEmail?.toLowerCase() === user.email?.toLowerCase())) ||
                (emp.fullName && user?.fullName && emp.fullName.toLowerCase() === user.fullName.toLowerCase()) ||
                (emp.name && user?.name && emp.name.toLowerCase() === user.name.toLowerCase())
            ) || res.data.data[0];

            if (match?._id) {
              const fullRes = await api.get(`/employees/${match._id}`);
              if (fullRes.data?.success && fullRes.data?.data) {
                setProfile(fullRes.data.data);
                return;
              }
            }
            setProfile(match);
          }
        }
      } catch (err) {
        console.error("Error fetching employee profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Fallback defaults if search doesn't return data
  const displayName = profile?.fullName || profile?.name || user?.fullName || user?.name || "Employee Portal User";
  const displayRole = profile?.role || user?.role || "Employee";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-[#162335]">
        <h1 className="text-xl sm:text-2xl font-black text-[#162335]">My Profile</h1>
        <p className="text-xs font-bold uppercase tracking-widest text-[#9ca3af] mt-1">Official Credentials & Settings</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-[#162335]" size={32} />
          <p className="text-[10px] text-slate-400 font-bold uppercase">Loading profile...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel: Profile Badge */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-3xl bg-[#162335] border-4 border-[#9ca3af] text-white flex items-center justify-center text-3xl font-black shadow-md">
              {displayName.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "EP"}
            </div>
            <div>
              <h2 className="text-lg font-black text-[#162335]">{displayName}</h2>
              <p className="text-xs font-bold text-[#9ca3af] uppercase mt-0.5">{displayRole}</p>
            </div>
            <div className="w-full border-t border-slate-100 pt-4 flex justify-around text-center">
              <div>
                <p className="text-[9px] font-extrabold text-slate-400 uppercase">Employee ID</p>
                <p className="font-mono text-xs font-black text-[#162335] mt-0.5">
                  {profile?.employeeId || user?.employeeId || "-"}
                </p>
              </div>
              <div className="w-px bg-slate-150 h-8 self-center" />
              <div>
                <p className="text-[9px] font-extrabold text-slate-400 uppercase">Status</p>
                <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black rounded-full mt-1 ${
                  (profile?.status || "Active") === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}>
                  {profile?.status || "Active"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel: Complete Profile details */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-black text-[#162335] border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Shield size={16} className="text-[#9ca3af]" />
              Employment Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-slate-700">
              <div className="space-y-1">
                <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Official Email Address</p>
                <p className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Mail size={14} className="text-slate-400" />
                  {profile?.officialEmail || profile?.email || user?.officialEmail || user?.email || "-"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Personal Email Address</p>
                <p className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Mail size={14} className="text-slate-400" />
                  {profile?.personalEmail || "-"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Mobile Number</p>
                <p className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Phone size={14} className="text-slate-400" />
                  {profile?.phone || user?.phone || "-"}
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
                  {formatDisplayDate(profile?.joiningDate)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Date of Birth</p>
                <p className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Calendar size={14} className="text-slate-400" />
                  {formatDisplayDate(profile?.dateOfBirth || profile?.dob)}
                </p>
              </div>

              <div className="col-span-full space-y-1 border-t border-slate-100 pt-4 mt-2">
                <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Permanent Address</p>
                <p className="font-semibold text-slate-700 flex items-start gap-1.5 mt-1 leading-relaxed">
                  <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  {profile?.address || "NOBAL FINANCE Corporate Branch, Gujarat, India"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
