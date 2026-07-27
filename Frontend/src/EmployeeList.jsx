import { useEffect, useState, useCallback } from "react";
import api from "./api"; // જો તમારી api.js src/ માં હોય તો ./api રાખો
import { Search, Edit, Trash2, Eye, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal States
  const [viewEmp, setViewEmp] = useState(null); // View Modal State
  const [editingEmp, setEditingEmp] = useState(null); // Edit Modal State
  const [editForm, setEditForm] = useState({
    fullName: "",
    personalEmail: "",
    phone: "",
    role: "",
    address: "",
    dateOfBirth: "",
    joiningDate: "",
    status: "Active"
  });

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/employees?page=${page}&limit=10&search=${search}`);
      if (res.data.success) {
        setEmployees(res.data.data);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchEmployees(), 400); // Debouncing
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  // View Details API / Handler
  const handleViewClick = async (empId) => {
    try {
      const res = await api.get(`/employees/${empId}`);
      if (res.data.success) {
        setViewEmp(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fetch employee details");
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/employees/${editingEmp._id}`, editForm);
      if (res.data.success) {
        setEditingEmp(null);
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update employee");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await api.delete(`/employees/${id}`);
        fetchEmployees();
      } catch (err) {
        console.error(err);
        alert("Failed to delete employee");
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h3 className="text-xl font-black text-[#0a2540]">All Employee Records</h3>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search employee..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#0a2540] outline-none focus:border-[#d4af37]"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-[#0a2540]" size={32} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0a2540] text-[#d4af37] font-extrabold uppercase tracking-wider whitespace-nowrap">
              <tr>
                <th className="py-3.5 px-4 rounded-l-xl">EMP ID</th>
                <th className="py-3.5 px-4">NAME</th>
                <th className="py-3.5 px-4">PERSONAL EMAIL</th>
                <th className="py-3.5 px-4">PHONE</th>
                <th className="py-3.5 px-4">ROLE</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-right rounded-r-xl">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-4 font-mono font-black text-[#0a2540]">{emp.employeeId}</td>
                    <td className="py-4 px-4 font-bold text-[#0a2540]">{emp.fullName}</td>
                    <td className="py-4 px-4 text-slate-500">{emp.personalEmail}</td>
                    <td className="py-4 px-4 text-slate-500">{emp.phone}</td>
                    <td className="py-4 px-4 text-slate-500">{emp.role}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black ${emp.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* VIEW ICON */}
                      <button
                        onClick={() => handleViewClick(emp._id)}
                        title="View Details"
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                      >
                        <Eye size={14} />
                      </button>

                      {/* EDIT ICON */}
                      <button
                        onClick={() => {
                          setEditingEmp(emp);
                          setEditForm({
                            fullName: emp.fullName || "",
                            personalEmail: emp.personalEmail || "",
                            phone: emp.phone || "",
                            role: emp.role || "",
                            address: emp.address || "",
                            dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split('T')[0] : "",
                            joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : "",
                            status: emp.status || "Active"
                          });
                        }}
                        title="Edit Employee"
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition"
                      >
                        <Edit size={14} />
                      </button>

                      {/* DELETE ICON */}
                      <button
                        onClick={() => handleDelete(emp._id)}
                        title="Delete Employee"
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500 font-medium">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 border border-slate-200 rounded-xl text-slate-600 disabled:opacity-40 hover:bg-slate-50">
            <ChevronLeft size={16} />
          </button>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2 border border-slate-200 rounded-xl text-slate-600 disabled:opacity-40 hover:bg-slate-50">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 1. VIEW DETAILS MODAL */}
      {viewEmp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border-t-8 border-t-[#0a2540] max-h-[85vh] overflow-y-auto">
            <button onClick={() => setViewEmp(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <h3 className="text-lg font-black text-[#0a2540] mb-4">Employee Details</h3>

            <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-400">Employee ID</span>
                <span className="font-mono font-black text-[#0a2540]">{viewEmp.employeeId}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-400">Full Name</span>
                <span className="font-bold text-[#0a2540]">{viewEmp.fullName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-400">Personal Email</span>
                <span className="font-semibold text-slate-800">{viewEmp.personalEmail}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-400">Official Login Email</span>
                <span className="font-semibold text-slate-800">{viewEmp.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-400">Generated Login Password</span>
                {/* <span className="font-mono font-bold text-amber-600">{viewEmp.temporaryPassword || "••••••••"}</span> */}
                <span className="font-mono font-bold text-amber-600">{viewEmp.passworsd}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-400">Phone</span>
                <span className="text-slate-800">{viewEmp.phone}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-400">Role</span>
                <span className="font-semibold">{viewEmp.role}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-400">DOB (Date of Birth)</span>
                <span>{viewEmp.dateOfBirth ? new Date(viewEmp.dateOfBirth).toLocaleDateString() : "-"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-400">Joining Date</span>
                <span>{viewEmp.joiningDate ? new Date(viewEmp.joiningDate).toLocaleDateString() : "-"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-400">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${viewEmp.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                  {viewEmp.status}
                </span>
              </div>
              {viewEmp.address && (
                <div className="flex flex-col gap-1 pt-1">
                  <span className="font-bold text-slate-400">Address</span>
                  <span className="text-slate-800 break-words">{viewEmp.address}</span>
                </div>
              )}
            </div>

            <button onClick={() => setViewEmp(null)} className="w-full mt-5 py-2.5 bg-[#0a2540] text-white font-bold rounded-xl text-xs uppercase">
              Close
            </button>
          </div>
        </div>
      )}

      {/* 2. EDIT MODAL */}
      {editingEmp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border-t-8 border-t-[#0a2540] max-h-[90vh] overflow-y-auto">
            <button onClick={() => setEditingEmp(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <h3 className="text-lg font-black text-[#0a2540] mb-4">Edit Employee Record</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">

              {/* Readonly Section */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                <div>
                  <span className="block font-bold text-slate-400 mb-0.5">Employee ID</span>
                  <span className="font-mono font-black text-slate-600">{editingEmp.employeeId}</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-400 mb-0.5">Official Login Email</span>
                  <span className="font-semibold text-slate-600 break-all">{editingEmp.email}</span>
                </div>
                <div className="sm:col-span-2 border-t pt-2">
                  <span className="block font-bold text-slate-400 mb-0.5">Generated Password (Read-Only)</span>
                  <span className="font-mono font-bold text-amber-600">{editingEmp.temporaryPassword || "••••••••"}</span>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 uppercase mb-1">Personal Email *</label>
                  <input
                    type="email"
                    required
                    value={editForm.personalEmail}
                    onChange={(e) => setEditForm({ ...editForm, personalEmail: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 uppercase mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 uppercase mb-1">Role / Dept *</label>
                  <input
                    type="text"
                    required
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 uppercase mb-1">Date of Birth (DOB) *</label>
                  <input
                    type="date"
                    required
                    value={editForm.dateOfBirth}
                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 uppercase mb-1">Joining Date *</label>
                  <input
                    type="date"
                    required
                    value={editForm.joiningDate}
                    onChange={(e) => setEditForm({ ...editForm, joiningDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-extrabold text-slate-700 uppercase mb-1">Status *</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:border-[#d4af37]"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-extrabold text-slate-700 uppercase mb-1">Address</label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:border-[#d4af37] resize-none"
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-[#0a2540] text-[#d4af37] font-black rounded-xl text-xs uppercase shadow-md mt-4">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
