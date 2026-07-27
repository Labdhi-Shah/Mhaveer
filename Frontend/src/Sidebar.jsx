import React from "react";
import { LayoutDashboard, Users, UserPlus, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 fixed top-16 bottom-0 left-0 z-40 flex flex-col justify-between p-4 shadow-sm">
      <div>
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 my-3">
          NAVIGATION
        </p>

        <div className="space-y-1.5">
          <button
            onClick={() => navigate("/dashboard")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition ${
              location.pathname === "/dashboard"
                ? "bg-[#0a2540] text-[#d4af37] shadow-md"
                : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button
            onClick={() => navigate("/employees")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              location.pathname === "/employees"
                ? "bg-[#0a2540] text-[#d4af37] shadow-md"
                : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
            }`}
          >
            <Users size={18} />
            Employee List
          </button>

          <button
            onClick={() => navigate("/add-employee")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              location.pathname === "/add-employee"
                ? "bg-[#0a2540] text-[#d4af37] shadow-md"
                : "text-slate-600 hover:bg-slate-100 hover:text-[#0a2540]"
            }`}
          >
            <UserPlus size={18} />
            Add Employee
          </button>
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
  );
}