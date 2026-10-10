import { useState, useEffect, useRef } from "react";
import { Bell, Menu, ChevronDown, Clock, Circle, User, Key, LogOut, PauseCircle, PlayCircle, CheckCircle, Check } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import api from "./api";
import logoSvg from "./assets/new_logo.png";
import { getUserRoleCategory } from "./utils/hierarchy";
import io from "socket.io-client";
import { formatDistanceToNow } from "date-fns";

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const roleCategory = getUserRoleCategory(user);

  const [attendance, setAttendance] = useState(null);
  const [elapsed, setElapsed] = useState("00:00:00");
  const [loading, setLoading] = useState(false);
  const [meetingCount, setMeetingCount] = useState(0);

  const [notifications, setNotifications] = useState([]);

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchNotifications();
    }
  }, [user]);

  // Socket
  useEffect(() => {
    if (!user) return;
    const socket = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "https://mhaveer.onrender.com");
    
    socket.on("connect", () => {
      console.log("Header socket connected");
    });
    
    const handleDataUpdated = () => {
      fetchNotifications();
    };

    socket.on("data-updated", handleDataUpdated);

    return () => {
      socket.off("data-updated", handleDataUpdated);
      socket.disconnect();
    };
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
    return "Telecalling Portal";
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
    if (user) {
      fetchAttendanceStatus();
    }
  }, [user, roleCategory]);

  useEffect(() => {
    if (!attendance || !attendance.attendanceStarted || !attendance.loginTime) {
      setElapsed("00:00:00");
      return;
    }

    if (attendance.logoutTime) {
      const start = new Date(attendance.loginTime);
      const end = new Date(attendance.logoutTime);
      const diffSecs = Math.max(0, Math.floor((end - start) / 1000));
      const hours = Math.floor(diffSecs / 3600);
      const minutes = Math.floor((diffSecs % 3600) / 60);
      const pad = (n) => String(n).padStart(2, "0");
      setElapsed(`${pad(hours)}:${pad(minutes)}`);
      return;
    }

    const updateTimer = () => {
      const start = new Date(attendance.loginTime);
      const now = new Date();
      const diffSecs = Math.max(0, Math.floor((now - start) / 1000));
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

  // handleAttendanceClick and timer logic removed as attendance is now fully automated on login/logout.

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

      if (user && (user.id || user._id)) {
        const employeeId = user.id || user._id;
        await api.post("/auth/logout", { employeeId });
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
    if (!attendance || !attendance.attendanceStarted || !attendance.loginTime) {
      return null;
    } else if (!attendance.logoutTime) {
      return {
        label: `Working (${elapsed})`,
        mobileLabel: elapsed,
        icon: <Clock size={16} />,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10 border-emerald-400/50",
        showPulse: true
      };
    } else {
      return {
        label: `Completed (${elapsed})`,
        mobileLabel: `Done (${elapsed})`,
        icon: <CheckCircle size={16} />,
        color: "text-slate-400",
        bg: "bg-transparent border-slate-700",
        showPulse: false
      };
    }
  };

  const widgetProps = getTimerWidgetProps();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#162335] text-white border-b-2 border-[#FFFFFF] z-50 flex items-center justify-between px-4 md:px-6 shadow-md select-none">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-300 hover:text-white rounded-lg transition md:hidden cursor-pointer"
          title="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center overflow-hidden shrink-0">
          <img
            src={logoSvg}
            alt="NOBAL FINANCE Logo"
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
        <div className="hidden sm:block">
          <span className="font-black text-sm sm:text-lg tracking-wide text-white whitespace-nowrap">
            NOBAL <span className="text-[#9ca3af]">FINANCE</span>
          </span>
        </div>

        {/* Page Title */}
        <div className="h-6 w-px bg-[#FFFFFF] mx-2 hidden md:block" />
        <span className="font-extrabold text-xs text-slate-300 tracking-wider uppercase whitespace-nowrap hidden md:block">
          {getPageTitle()}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {widgetProps && (
          <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-xl shadow-md font-bold text-xs ${widgetProps.color} ${widgetProps.bg}`}>
            <div className={widgetProps.showPulse ? "animate-pulse" : ""}>
              {widgetProps.icon}
            </div>
            <span className="font-mono tracking-widest hidden sm:inline">{widgetProps.label}</span>
            <span className="font-mono tracking-widest inline sm:hidden">{widgetProps.mobileLabel || widgetProps.label}</span>
            {widgetProps.showPulse && (
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            )}
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            className="p-1.5 sm:p-2 text-slate-300 hover:text-[#9ca3af] rounded-lg transition relative hidden sm:block cursor-pointer"
            title="Notifications"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center border-2 border-[#162335]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 text-slate-700 overflow-hidden z-50 flex flex-col max-h-[400px]">
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-black text-[#162335]">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-[#9ca3af] hover:text-[#162335] transition flex items-center gap-1 cursor-pointer"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>
              <div className="overflow-y-auto p-2 space-y-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 font-bold">No notifications</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-3 rounded-xl flex items-start gap-3 transition ${notif.read ? 'bg-white opacity-70' : 'bg-[#9ca3af]/10'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${notif.read ? 'text-slate-600' : 'text-[#162335]'}`}>
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[9px] font-mono text-slate-400 mt-1.5">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!notif.read && (
                        <button
                          onClick={() => markAsRead(notif._id)}
                          className="text-[#9ca3af] hover:text-emerald-500 transition cursor-pointer p-1"
                          title="Mark as read"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-[#FFFFFF]" />

        {/* Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FFFFFF] text-[#162335] flex items-center justify-center font-black text-xs shadow-md">
              {initials}
            </div>
            <ChevronDown size={14} className={`text-slate-300 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu Card */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 text-slate-700 overflow-hidden z-50">
              {/* Profile Details Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-1">
                <p className="text-xs font-black text-[#162335] truncate">{user?.fullName || user?.name || "Employee User"}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Role: <span className="text-[#9ca3af]">{user?.role || "Representative"}</span>
                </p>
                <>
                  <p className="text-[9px] font-mono text-slate-400">ID: {user?.employeeId || "N/A"}</p>
                  <p className="text-[9px] font-mono text-slate-400">Email: {user?.email || "N/A"}</p>
                  <p className="text-[9px] font-extrabold text-[#162335] uppercase tracking-widest mt-1">Branch: Corporate Gujarat</p>
                </>
              </div>

              {/* Action Menu Links */}
              <div className="p-2 space-y-0.5">
                <>
                  <button
                    onClick={() => { navigate("/profile"); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:text-[#162335] font-bold transition text-left"
                  >
                    <User size={14} /> My Profile
                  </button>
                  <button
                    onClick={() => { navigate("/attendance"); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:text-[#162335] font-bold transition text-left"
                  >
                    <Clock size={14} /> Attendance Logs
                  </button>
                </>


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
      </div >
    </header >
  );
}