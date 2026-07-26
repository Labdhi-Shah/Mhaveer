import React from "react";
import { Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DashboardView({ employees = [], onOpenForm }) {
  const navigate = useNavigate();

  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.status === "Active").length,
    inactive: employees.filter((e) => e.status === "Inactive").length,
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-8 border-l-[#0a2540]">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#d4af37]">
            Executive Overview
          </p>
          <h1 className="text-2xl font-black text-[#0a2540] mt-0.5">Super Admin Dashboard</h1>
          <p className="text-slate-500 text-xs mt-0.5">Overview & Employee Management System</p>
        </div>
        <button
          onClick={onOpenForm}
          className="bg-[#d4af37] hover:bg-[#c39e2d] text-[#0a2540] px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-md"
        >
          Add New Employee
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-[#0a2540] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
              TOTAL EMPLOYEES
            </p>
            <h2 className="text-3xl font-black text-[#0a2540] mt-1">{stats.total}</h2>
          </div>
          <div className="w-12 h-12 bg-[#0a2540] text-[#d4af37] rounded-2xl flex items-center justify-center shadow-md">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-[#d4af37] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
              ACTIVE EMPLOYEES
            </p>
            <h2 className="text-3xl font-black text-emerald-600 mt-1">{stats.active}</h2>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl flex items-center justify-center shadow-sm">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-rose-500 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
              INACTIVE EMPLOYEES
            </p>
            <h2 className="text-3xl font-black text-rose-600 mt-1">{stats.inactive}</h2>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl flex items-center justify-center shadow-sm">
            <Users size={22} />
          </div>
        </div>
      </div>

        <div className="flex items-center justify-between mb-6">
         

      
      </div>
    </div>
  );
}