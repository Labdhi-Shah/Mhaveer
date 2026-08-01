import { useState, useEffect, useRef } from "react";
import { Bell, Menu, ChevronDown, Clock, Circle, User, Key, LogOut, PauseCircle, PlayCircle, CheckCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import api from "./api";
import logoSvg from "./assets/logo.svg";
import { getUserRoleCategory } from "./utils/hierarchy";

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const roleCategory = getUserRoleCategory(user);
  const isSuperAdmin = roleCategory === "Admin";

  const [attendance, setAttendance] = useState(null);
  const [elapsed, setElapsed] = useState("00:00:00");
  const [loading, setLoading] = useState(false);

  // Format Page Title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("dashboard")) return "Dashboard Overview";
    if (path.includes("new-lead")) return "New Loan Lead";
    if (path.includes("my-leads")) return "Leads Log";
    if (path.includes("follow-up")) return "Call Back Follow-ups";
    if (path.includes("meetings")) return "Scheduled Meetings";
    if (path.includes("profile")) return "Employee Profile";

    if (path.includes("employees")) return "Employee Directory";
    if (path.includes("add-employee")) return "Register Employee";
    if (path.includes("attendance")) return "Attendance Logs";
    return "CRM Portal";
  };

  const fetchAttendanceStatus = async () => {
    try {
      const res = await api.get("/attendance/today");
      if (res.data.success) {
        setAttendance(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch today's attendance", err);
    }
  };

  useEffect(() => {
    if (user && !isSuperAdmin) {
      fetchAttendanceStatus();
    }
  }, [user, isSuperAdmin]);

  useEffect(() => {
    if (!attendance || attendance.status === "Not Started") {
      setElapsed("00:00:00");
      return;
    }

    if (attendance.status === "Completed") {
      if (attendance.totalWorkingHours) {
        setElapsed(`${attendance.totalWorkingHours}:00`);
      } else {
        setElapsed("00:00:00");
      }
      return;
    }

    const updateTimer = () => {
      if (!attendance.startTime) return;
      const start = new Date(attendance.startTime);
      let currentEnd = new Date();

      if (attendance.status === "On Break" && attendance.breaks && attendance.breaks.length > 0) {
        currentEnd = new Date(attendance.breaks[attendance.breaks.length - 1].startTime);
      }

      let elapsedMs = currentEnd - start;

      let breaksMs = 0;
      if (attendance.breaks) {
        attendance.breaks.forEach(b => {
          if (b.endTime) {
            breaksMs += (new Date(b.endTime) - new Date(b.startTime));
          }
        });
      }

      elapsedMs -= breaksMs;
      if (elapsedMs < 0) elapsedMs = 0;

      const diffSecs = Math.floor(elapsedMs / 1000);
      const hours = Math.floor(diffSecs / 3600);
      const minutes = Math.floor((diffSecs % 3600) / 60);
      const seconds = diffSecs % 60;

      const pad = (n) => String(n).padStart(2, "0");
      setElapsed(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [attendance]);

  const handleAttendanceClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (!attendance || attendance.status === "Not Started" || attendance.status === null) {
        const res = await api.post("/attendance/start");
        if (res.data.success) setAttendance(res.data.data);
      } else if (attendance.status === "Working") {
        const res = await api.post("/attendance/pause");
        if (res.data.success) setAttendance(res.data.data);
      } else if (attendance.status === "On Break") {
        const res = await api.post("/attendance/resume");
        if (res.data.success) setAttendance(res.data.data);
      }
      // If completed, do nothing
    } catch (err) {
      console.error("Attendance action failed", err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleLogout = async () => {
    try {
      if (attendance && attendance.status !== "Completed" && attendance.status !== "Not Started") {
        await api.post("/attendance/stop");
      }
      // Also call auth logout just to clear any old state
      const attendanceId = localStorage.getItem("attendanceId");
      if (attendanceId) {
        await api.post("/auth/logout", { attendanceId });
      }
    } catch (err) {
      console.error("Logout API failed", err);
    }
    logout();
    localStorage.removeItem("loginTime");
    localStorage.removeItem("attendanceId");
    navigate("/login", { replace: true });
  };

  const initials = (user?.fullName || user?.name || "SA")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const getTimerWidgetProps = () => {
    if (!attendance || attendance.status === "Not Started" || attendance.status === null) {
      return {
        label: "Start Work",
        mobileLabel: "Start",
        icon: <Clock size={16} />,
        color: "text-slate-300",
        bg: "bg-slate-800/60 hover:bg-slate-700/80",
        border: "border-transparent",
        showPulse: false
      };
    } else if (attendance.status === "Working") {
      return {
        label: elapsed,
        mobileLabel: elapsed,
        icon: <PauseCircle size={16} />,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10 hover:bg-emerald-400/20",
        border: "border-emerald-400/50",
        showPulse: true
      };
    } else if (attendance.status === "On Break") {
      return {
        label: `Lunch / Break (${elapsed})`,
        mobileLabel: `Break (${elapsed})`,
        icon: <PlayCircle size={16} />,
        color: "text-amber-400",
        bg: "bg-amber-400/10 hover:bg-amber-400/20",
        border: "border-amber-400/50",
        showPulse: false
      };
    } else if (attendance.status === "Completed") {
      return {
        label: `Completed (${elapsed})`,
        mobileLabel: `Done (${elapsed})`,
        icon: <CheckCircle size={16} />,
        color: "text-slate-400",
        bg: "bg-slate-800/40",
        border: "border-slate-700",
        showPulse: false,
        disabled: true
      };
    }
    return {};
  };

  const widgetProps = getTimerWidgetProps();

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
        <span className="font-extrabold text-xs text-slate-300 tracking-wider uppercase whitespace-nowrap hidden md:block">
          {getPageTitle()}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {user && !isSuperAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleAttendanceClick}
              disabled={widgetProps.disabled || loading}
              className={`flex items-center gap-2 border px-3 py-1.5 rounded-xl transition shadow-md font-bold text-xs cursor-pointer ${widgetProps.color} ${widgetProps.bg} ${widgetProps.border} ${widgetProps.disabled || loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              title={attendance?.status === "Working" ? "Click to Pause (Lunch/Break)" : (attendance?.status === "On Break" ? "Click to Resume Work" : "Start Working")}
            >
              <div className={widgetProps.showPulse ? "animate-pulse" : ""}>
                {widgetProps.icon}
              </div>
              <span className="font-mono tracking-widest hidden sm:inline">{widgetProps.label}</span>
              <span className="font-mono tracking-widest inline sm:hidden">{widgetProps.mobileLabel || widgetProps.label}</span>
              {widgetProps.showPulse && (
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              )}
            </button>
          </div>
        )}
        <button className="p-1.5 sm:p-2 text-slate-300 hover:text-[#d4af37] rounded-lg transition relative hidden sm:block" title="Notifications">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#d4af37] rounded-full" />
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
                      onClick={() => { navigate("/attendance"); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:text-[#0a2540] font-bold transition text-left"
                    >
                      <Clock size={14} /> Attendance Logs
                    </button>
                  </>
                )}


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