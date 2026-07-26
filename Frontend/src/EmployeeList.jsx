import { useMemo, useState } from "react";
import { Eye, Search, Trash2, ToggleLeft, ToggleRight, UserRound } from "lucide-react";

const statusStyles = {
  Active: "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20",
  Inactive: "bg-rose-500/10 text-rose-300 ring-1 ring-rose-400/20",
};

export default function EmployeeList({ employees, onToggleStatus, onDelete, onViewDetails }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return employees.filter((employee) => {
      const searchable = [employee.id, employee.fullName, employee.email, employee.phone].join(" ").toLowerCase();
      return searchable.includes(term);
    });
  }, [employees, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.26em] text-indigo-300">Directory</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Employee List</h2>
            <p className="mt-2 text-sm text-slate-400">Manage staff records, review profiles, and toggle account access quickly.</p>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3 text-sm text-slate-400">
            <Search className="h-4 w-4" />
            <input
              className="w-full border-0 bg-transparent text-sm text-white outline-none sm:w-64"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, ID, or email"
            />
          </label>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-slate-800/80 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee ID</th>
                  <th className="px-4 py-3 font-medium">Full Name</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Role / Department</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-900/40 text-slate-300">
                {filteredEmployees.length ? filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="transition hover:bg-slate-800/70">
                    <td className="px-4 py-3 font-medium text-white">{employee.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-300">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{employee.fullName}</p>
                          <p className="text-xs text-slate-400">{employee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white">{employee.email}</p>
                      <p className="text-xs text-slate-400">{employee.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white">{employee.role}</p>
                      <p className="text-xs text-slate-400">{employee.department}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[employee.status]}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewDetails(employee)}
                          className="rounded-xl border border-white/10 bg-slate-800/70 p-2 text-slate-300 transition hover:border-indigo-500/40 hover:text-white"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onToggleStatus(employee.id)}
                          className="rounded-xl border border-white/10 bg-slate-800/70 p-2 text-slate-300 transition hover:border-indigo-500/40 hover:text-white"
                          title="Toggle status"
                        >
                          {employee.status === "Active" ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => onDelete(employee.id)}
                          className="rounded-xl border border-white/10 bg-slate-800/70 p-2 text-rose-300 transition hover:border-rose-400/40 hover:text-rose-200"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                      No employees match the current search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
