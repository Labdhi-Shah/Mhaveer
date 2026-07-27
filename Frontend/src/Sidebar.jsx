import { 
  LayoutDashboard, Users, UserPlus, LogOut, 
  PlusCircle, FolderHeart, Clock, Calendar, User, Settings 
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    localStorage.removeItem("loginTime");
    navigate("/login", { replace: true });
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  const isSuperAdmin = user?.role === "SuperAdmin";

  return (
    <>
      {/* Mobile Sidebar Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      <aside className={`w-64 bg-white border-r border-slate-200 fixed top-16 bottom-0 left-0 z-40 flex flex-col justify-between p-4 shadow-sm transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}>
        <div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 my-3">
            {isSuperAdmin ? "ADMIN PANEL" : "EMPLOYEE PORTAL"}
          </p>

          <div className="space-y-1.5">
            {isSuperAdmin ? (
              // Super Admin Sidebar Options
              <>
                <button
                  onClick={() => handleNavigation("/dashboard")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    location.pathname === "/dashboard"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                  }`}
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </button>

                <button
                  onClick={() => handleNavigation("/employees")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    location.pathname === "/employees"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                  }`}
                >
                  <Users size={18} />
                  Employee List
                </button>

                <button
                  onClick={() => handleNavigation("/add-employee")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    location.pathname === "/add-employee"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                  }`}
                >
                  <UserPlus size={18} />
                  Add Employee
                </button>
              </>
            ) : (
              // Employee (Reception / Front Desk) Sidebar Options
              <>
                <button
                  onClick={() => handleNavigation("/dashboard")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    location.pathname === "/dashboard"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                  }`}
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </button>

                <button
                  onClick={() => handleNavigation("/new-lead")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    location.pathname === "/new-lead"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                  }`}
                >
                  <PlusCircle size={18} />
                  New Lead
                </button>

                <button
                  onClick={() => handleNavigation("/my-leads")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    location.pathname === "/my-leads"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                  }`}
                >
                  <FolderHeart size={18} />
                  My Leads
                </button>

                <button
                  onClick={() => handleNavigation("/follow-up")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    location.pathname === "/follow-up"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                  }`}
                >
                  <Clock size={18} />
                  Follow-up
                </button>

                <button
                  onClick={() => handleNavigation("/meetings")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    location.pathname === "/meetings"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                  }`}
                >
                  <Calendar size={18} />
                  Meetings
                </button>

                <button
                  onClick={() => handleNavigation("/profile")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    location.pathname === "/profile"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                  }`}
                >
                  <User size={18} />
                  Profile
                </button>

                <button
                  onClick={() => handleNavigation("/settings")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    location.pathname === "/settings"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                  }`}
                >
                  <Settings size={18} />
                  Settings
                </button>
              </>
            )}
          </div>
        </div>

        {/* FIXED GOLDEN LOGOUT AT BOTTOM LEFT */}
        <div className="pt-3 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#d4af37] hover:bg-[#c39e2d] text-[#0a2540] font-black py-3 px-4 rounded-xl shadow-md transition-all text-xs uppercase tracking-wider cursor-pointer"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}