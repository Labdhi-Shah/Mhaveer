import {
  LayoutDashboard, Users, UserPlus,
  PlusCircle, FolderHeart, Clock, Calendar, ClipboardList,
  BarChart2
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { getUserRole } from "./utils/hierarchy";

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

  const role = getUserRole(user);
  const isManager = role === "Manager";
  const dashboardRoute = isManager ? "/telecalling/manager" : "/telecalling/employee";
  const getPortalLabel = () => isManager ? "MANAGER PORTAL" : "EMPLOYEE PORTAL";

  const isDashboardActive =
    location.pathname === "/dashboard" ||
    location.pathname === "/telecalling/manager" ||
    location.pathname === "/telecalling/employee";

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      <aside className={`w-64 bg-white border-r border-slate-200 fixed top-16 bottom-0 left-0 z-40 flex flex-col justify-between p-4 shadow-sm transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}>
        <div>
          <p className="text-[12px] font-extrabold text-slate-400 uppercase tracking-widest px-3 my-3">
            {getPortalLabel()}
          </p>

          <div className="space-y-1.5">
            <button
              onClick={() => handleNavigation(dashboardRoute)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${isDashboardActive
                  ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                  : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                }`}
            >
              <LayoutDashboard size={18} />
              Telecalling Dashboard
            </button>

            {isManager && (
              <>
                <button
                  onClick={() => handleNavigation("/telecalling/employees")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    location.pathname === "/telecalling/employees" || location.pathname === "/employees"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                  }`}
                >
                  <Users size={18} />
                  Employee List
                </button>

                <button
                  onClick={() => handleNavigation("/telecalling/add-employee")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    location.pathname === "/telecalling/add-employee" || location.pathname === "/add-employee"
                      ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
                  }`}
                >
                  <UserPlus size={18} />
                  Add Employee
                </button>

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

            {!isManager && (
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
              </>
            )}

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
          </div>
        </div>
      </aside>
    </>
  );
}