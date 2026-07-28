import { useState, useEffect, useRef } from "react";
import { Bell, Settings, Menu, ChevronDown, Clock, Circle, User, Key, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import api from "./api";
import logoSvg from "./assets/logo.svg";

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [elapsed, setElapsed] = useState("00:00:00");
  const dropdownRef = useRef(null);

  const [isOnBreak, setIsOnBreak] = useState(() => localStorage.getItem("isOnBreak") === "true");
  const [isBreakLoading, setIsBreakLoading] = useState(false);

  const loginTimeStr = localStorage.getItem("loginTime");

  const toggleBreak = async () => {
    const attendanceId = localStorage.getItem("attendanceId");
    if (!attendanceId) return;

    setIsBreakLoading(true);
    try {
      if (isOnBreak) {
        await api.put("/attendance/break/end", { attendanceId });
        setIsOnBreak(false);
        localStorage.removeItem("isOnBreak");
      } else {
        await api.put("/attendance/break/start", { attendanceId });
        setIsOnBreak(true);
        localStorage.setItem("isOnBreak", "true");
      }
    } catch (err) {
      console.error("Error toggling break", err);
    } finally {
      setIsBreakLoading(false);
    }
  };

  // Format Page Title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("dashboard")) return "Dashboard Overview";
    if (path.includes("new-lead")) return "New Loan Lead";
    if (path.includes("my-leads")) return "Leads Log";
    if (path.includes("follow-up")) return "Call Back Follow-ups";
    if (path.includes("meetings")) return "Scheduled Meetings";
    if (path.includes("profile")) return "Employee Profile";
    if (path.includes("settings")) return "Account Settings";
    if (path.includes("employees")) return "Employee Directory";
    if (path.includes("add-employee")) return "Register Employee";
    if (path.includes("attendance")) return "Attendance Logs";
    return "CRM Portal";
  };

  // Live Timer Effect
  useEffect(() => {
    if (!loginTimeStr || isOnBreak) return;
    
    // Initial run
    const updateTimer = () => {
      const start = new Date(loginTimeStr);
      const now = new Date();
      // Need to adjust for total break time if they already took breaks, but simpler for now just to pause.
      const diffMs = now - start;
      if (diffMs < 0) return;

      const diffSecs = Math.floor(diffMs / 1000);
      const hours = Math.floor(diffSecs / 3600);
      const minutes = Math.floor((diffSecs % 3600) / 60);
      const seconds = diffSecs % 60;

      const pad = (n) => String(n).padStart(2, "0");
      setElapsed(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [loginTimeStr, isOnBreak]);

  // Click outside dropdown handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatLoginTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const handleLogout = async () => {
    const attendanceId = localStorage.getItem("attendanceId");
    if (attendanceId) {
      try {
        await api.post("/auth/logout", { attendanceId });
      } catch (err) {
        console.error("Logout API failed", err);
      }
    }
    logout();
    localStorage.removeItem("loginTime");
    localStorage.removeItem("attendanceId");
    localStorage.removeItem("isOnBreak");
    navigate("/login", { replace: true });
  };

  const isSuperAdmin = user?.role === "SuperAdmin";
  const initials = (user?.fullName || user?.name || "SA")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#0a2540] text-white border-b-2 border-[#d4af37] z-50 flex items-center justify-between px-4 md:px-6 shadow-md select-none">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-300 hover:text-white rounded-lg transition md:hidden cursor-pointer"
          title="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white p-1 rounded-xl flex items-center justify-center shadow-md overflow-hidden shrink-0">
          <img 
            src={logoSvg} 
            alt="MHAVEER FINCAP Logo" 
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
        <div className="hidden sm:block">
          <span className="font-black text-sm sm:text-lg tracking-wide text-white whitespace-nowrap">
            MHAVEER <span className="text-[#d4af37]">FINCAP</span>
          </span>
        </div>
        
        {/* Page Title */}
        <div className="h-6 w-px bg-slate-700 mx-2 hidden md:block" />
        <span className="font-extrabold text-xs text-slate-300 tracking-wider uppercase whitespace-nowrap">
          {getPageTitle()}
        </span>
      </div>

      {/* CENTER SECTION - WORKING TIMER FOR EMPLOYEES */}
      {!isSuperAdmin && loginTimeStr && (
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl py-1.5 px-3 md:px-5 shadow-inner">
            <div className="text-[10px] text-slate-300 hidden md:block font-bold">
              Login: <span className="text-white">{formatLoginTime(loginTimeStr)}</span>
            </div>
            <div className="h-4 w-px bg-slate-700 hidden md:block" />
            <div className="flex items-center gap-1">
              <Circle size={8} className={isOnBreak ? "fill-yellow-500 text-yellow-500 animate-pulse" : "fill-emerald-500 text-emerald-500"} />
              <span className={`text-[10px] font-black uppercase tracking-wider ${isOnBreak ? "text-yellow-400" : "text-emerald-400"}`}>
                {isOnBreak ? "On Break" : "Online"}
              </span>
            </div>
          </div>
          
          <button 
            onClick={toggleBreak}
            disabled={isBreakLoading}
            className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all ${
              isOnBreak 
                ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                : "bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600"
            } disabled:opacity-50`}
          >
            {isOnBreak ? "▶ Resume Work" : "☕ Take Break"}
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-4">
        {!isSuperAdmin && loginTimeStr && (
          <button 
            className={`p-1.5 sm:p-2 rounded-lg transition relative ${
              isOnBreak ? "text-yellow-400 hover:text-yellow-500" : "text-slate-300 hover:text-[#d4af37]"
            }`} 
            title={isOnBreak ? "Working Timer (PAUSED)" : `Working Timer: ${elapsed}`}
          >
            <Clock size={18} className={isOnBreak ? "" : "animate-pulse"} />
          </button>
        )}
        <button className="p-1.5 sm:p-2 text-slate-300 hover:text-[#d4af37] rounded-lg transition relative" title="Notifications">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#d4af37] rounded-full" />
        </button>
        <button onClick={() => navigate("/settings")} className="p-1.5 sm:p-2 text-slate-300 hover:text-[#d4af37] rounded-lg transition" title="Settings">
          <Settings size={18} />
        </button>

        <div className="h-6 w-px bg-slate-700" />

        {/* Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#d4af37] text-[#0a2540] flex items-center justify-center font-black text-xs shadow-md">
              {initials}
            </div>
            <ChevronDown size={14} className={`text-slate-300 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu Card */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 text-slate-700 overflow-hidden z-50">
              {/* Profile Details Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-1">
                <p className="text-xs font-black text-[#0a2540] truncate">{user?.fullName || user?.name || "Employee User"}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Role: <span className="text-[#d4af37]">{user?.role || "Representative"}</span>
                </p>
                {!isSuperAdmin && (
                  <>
                    <p className="text-[9px] font-mono text-slate-400">ID: {user?.employeeId || "N/A"}</p>
                    <p className="text-[9px] font-mono text-slate-400">Email: {user?.email || "N/A"}</p>
                    <p className="text-[9px] font-extrabold text-[#0a2540] uppercase tracking-widest mt-1">Branch: Corporate Gujarat</p>
                  </>
                )}
                {isSuperAdmin && (
                  <p className="text-[9px] font-mono text-slate-400">Email: admin@mhaveerfincap.com</p>
                )}
              </div>

              {/* Action Menu Links */}
              <div className="p-2 space-y-0.5">
                {!isSuperAdmin && (
                  <>
                    <button
                      onClick={() => { navigate("/profile"); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:text-[#0a2540] font-bold transition text-left"
                    >
                      <User size={14} /> My Profile
                    </button>
                    <button
                      onClick={() => { navigate("/dashboard"); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:text-[#0a2540] font-bold transition text-left"
                    >
                      <Clock size={14} /> Attendance Logs
                    </button>
                  </>
                )}
                <button
                  onClick={() => { navigate("/settings"); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:text-[#0a2540] font-bold transition text-left"
                >
                  <Key size={14} /> Change Password
                </button>
                
                <div className="h-px bg-slate-100 my-1" />
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 font-bold transition text-left"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}