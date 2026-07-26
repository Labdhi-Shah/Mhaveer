import { PlusCircle, Users2 } from "lucide-react";
import { Link } from "react-router-dom";

const statusStyles = {
  Active: "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20",
  Inactive: "bg-rose-500/10 text-rose-300 ring-1 ring-rose-400/20",
};

export default function DashboardView({ employees }) {
  const activeCount = employees.filter((employee) => employee.status === "Active").length;
  const inactiveCount = employees.filter((employee) => employee.status === "Inactive").length;
  const recentEmployees = [...employees].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/30 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.26em] text-indigo-300">Overview</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Welcome back, Super Admin</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Monitor your employee network, add new hires, and keep every department aligned from one premium workspace.
          </p>
        </div>
        <Link
          to="/employees/add"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          <PlusCircle className="h-4 w-4" />
          Add New Employee
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/20">
          <p className="text-sm text-slate-400">Total Employees</p>
          <p className="mt-3 text-3xl font-semibold text-white">{employees.length}</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/20">
          <p className="text-sm text-slate-400">Active Employees</p>
          <p className="mt-3 text-3xl font-semibold text-white">{activeCount}</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/20">
          <p className="text-sm text-slate-400">Inactive Employees</p>
          <p className="mt-3 text-3xl font-semibold text-white">{inactiveCount}</p>
        </div>
      </div>
    </div>
  );
}
