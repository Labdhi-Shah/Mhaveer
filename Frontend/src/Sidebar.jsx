import {
  LayoutDashboard, Users, UserPlus,
  PlusCircle, FolderHeart, Clock, Calendar, ClipboardList,
  BarChart2
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { getUserRoleCategory } from "./utils/hierarchy";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  const roleCategory = getUserRoleCategory(user);

  const isSuperAdmin = roleCategory === "Admin";
  const isManager = roleCategory === "Manager";
  const isTeamLeader = roleCategory === "Team Leader";
  const isSales = user?.role === "Sales Department";
  const isEmployee = roleCategory === "Employee" && !isSales;

  const getPortalLabel = () => {
    if (isSuperAdmin) return "NAVIGATION";
    if (isManager) return "MANAGER PORTAL";
    if (isTeamLeader) return "TEAM LEADER PORTAL";
    if (isSales) return "SALES PORTAL";
    return "EMPLOYEE PORTAL";
  };

  const isDashboardActive =
    location.pathname === "/dashboard" ||
    location.pathname === "/admin-dashboard" ||
    location.pathname === "/sales-dashboard" ||
    location.pathname === "/team-leader-dashboard" ||
    location.pathname === "/hr-dashboard";

  return (
    <>
      {/* Mobile Sidebar Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      <aside className={`w-64 bg-white border-r border-slate-200 fixed top-16 bottom-0 left-0 z-40 flex flex-col justify-between p-4 shadow-sm transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}>
        <div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 my-3">
            {getPortalLabel()}
          </p>

          <div className="space-y-1.5">
            {/* Common Dashboard for non-Sales */}
            {!isSales && (
              <button
                onClick={() => handleNavigation("/dashboard")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${isDashboardActive
                    ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                  }`}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </button>
            )}

            {/* Sales Dashboard for Sales role only */}
            {isSales && (
              <>
                <button
                  onClick={() => handleNavigation("/dashboard")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${isDashboardActive
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                    }`}
                >
                  <LayoutDashboard size={18} />
                  Sales Dashboard
                </button>

                <button
                  onClick={() => handleNavigation("/meetings")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${location.pathname === "/meetings"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                    }`}
                >
                  <Calendar size={18} />
                  Meeting
                </button>

                <button
                  onClick={() => handleNavigation("/attendance")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${location.pathname === "/attendance"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                    }`}
                >
                  <ClipboardList size={18} />
                  Attendance
                </button>
              </>
            )}

            {/* Management specific options (Admin only) */}
            {isSuperAdmin && (
              <>
                <button
                  onClick={() => handleNavigation("/employees")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${location.pathname === "/employees"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                    }`}
                >
                  <Users size={18} />
                  Employee List
                </button>

                <button
                  onClick={() => handleNavigation("/add-employee")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${location.pathname === "/add-employee"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                    }`}
                >
                  <UserPlus size={18} />
                  Add Employee
                </button>
              </>
            )}

            {/* Management and Team Leader specific options */}
            {(isManager || isTeamLeader) && (
              <>
                <button
                  onClick={() => handleNavigation("/team-performance")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${location.pathname === "/team-performance"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                    }`}
                >
                  <BarChart2 size={18} />
                  Team Performance
                </button>
              </>
            )}

            {/* Employee specific options (Manager, Team Leader, Employee) */}
            {(isManager || isTeamLeader || isEmployee) && (
              <>
                <button
                  onClick={() => handleNavigation("/new-lead")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${location.pathname === "/new-lead"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                    }`}
                >
                  <PlusCircle size={18} />
                  New Lead
                </button>

                <button
                  onClick={() => handleNavigation("/my-leads")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${location.pathname === "/my-leads"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                    }`}
                >
                  <FolderHeart size={18} />
                  My Leads
                </button>

                <button
                  onClick={() => handleNavigation("/follow-up")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${location.pathname === "/follow-up"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                    }`}
                >
                  <Clock size={18} />
                  Follow-up
                </button>


                <button
                  onClick={() => handleNavigation("/meetings")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${location.pathname === "/meetings"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                    }`}
                >
                  <Calendar size={18} />
                  Meetings
                </button>

                <button
                  onClick={() => handleNavigation("/attendance")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${location.pathname === "/attendance"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                    }`}
                >
                  <ClipboardList size={18} />
                  Attendance
                </button>
              </>
            )}
          </div>
        </div>


      </aside>
    </>
  );
}