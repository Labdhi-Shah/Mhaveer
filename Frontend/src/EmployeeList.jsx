import React from "react";

export default function EmployeeList({ employees = [] }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-xl font-black text-[#0a2540] mb-4">All Employee Records</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0a2540] text-[#d4af37] font-extrabold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4 rounded-l-xl">EMPLOYEE ID</th>
              <th className="py-3.5 px-4">NAME</th>
              <th className="py-3.5 px-4">EMAIL</th>
              <th className="py-3.5 px-4">PHONE</th>
              <th className="py-3.5 px-4">ROLE</th>
              <th className="py-3.5 px-4 text-center rounded-r-xl">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50 transition">
                <td className="py-4 px-4 font-mono font-black text-[#0a2540]">{emp.id}</td>
                <td className="py-4 px-4 font-bold text-[#0a2540]">{emp.fullName}</td>
                <td className="py-4 px-4 text-slate-500">{emp.email}</td>
                <td className="py-4 px-4 text-slate-500">{emp.phone}</td>
                <td className="py-4 px-4 text-slate-500 font-medium">{emp.role}</td>
                <td className="py-4 px-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black ${
                      emp.status === "Active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {emp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}