import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api"; // જો તમારી api.js src/ માં હોય તો ./api રાખો
import { Search, Edit, Trash2, Eye, Loader2, ChevronLeft, ChevronRight, X, UserPlus, CheckCircle, Building2 } from "lucide-react";
import AddEmployee from "./AddEmployee";

const DEPARTMENTS = ["Sales Department", "Telecalling", "Admin", "Account & Fianc", "Marketing", "Manegement", "Human Resorece(HR)", "Collection & Records", "KYC Compliation", "Operations Department", "Customer Support", "Credit"];
const ROLES = ["Manager", "Employee"];

export default function EmployeeList() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [viewEmp, setViewEmp] = useState(null); // View Modal State
  const [editEmpModalId, setEditEmpModalId] = useState(null); // Edit Modal State


  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Clear messages after 3 seconds
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg("");
        setErrorMsg("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  useEffect(() => {
    const fetchAllEmps = async () => {
      try {
        await api.get("/employees?limit=1000");
      } catch (err) {
        console.error(err);
      }
    };
    fetchAllEmps();
  }, []);

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
      setErrorMsg(err.response?.data?.message || "Failed to fetch employee details");
    }
  };



  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await api.delete(`/employees/${id}`);
        setSuccessMsg("Employee deleted successfully");
        fetchEmployees();
      } catch (err) {
        console.error(err);
        setErrorMsg(err.response?.data?.message || "Failed to delete employee");
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="cursor-pointer hover:text-rose-800"><X size={14} /></button>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="cursor-pointer hover:text-emerald-900"><X size={14} /></button>
        </div>
      )}
      
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h3 className="text-xl font-black text-[#162335]">All Employee Records</h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search employee..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#162335] outline-none focus:border-[#9ca3af]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-[#162335]" size={32} />
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[800px]">
            <thead className="bg-[#162335] text-white font-extrabold uppercase tracking-wider whitespace-nowrap">
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
                    <td className="py-4 px-4 font-mono font-black text-[#162335]">{emp.employeeId}</td>
                    <td className="py-4 px-4 font-bold text-[#162335]">{emp.fullName}</td>
                    <td className="py-4 px-4 text-slate-500">{emp.personalEmail}</td>
                    <td className="py-4 px-4 text-slate-500">{emp.phone}</td>
                    <td className="py-4 px-4 text-slate-500">{emp.role} {emp.department ? `- ${emp.department}` : ''}</td>
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
                        onClick={() => setEditEmpModalId(emp._id)}
                        title="Edit Employee"
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition cursor-pointer"
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border-t-8 border-t-[#162335] max-h-[85vh] overflow-y-auto">
            <button onClick={() => setViewEmp(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <h3 className="text-lg font-black text-[#162335] mb-4">Employee Details</h3>

            <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-400">Employee ID</span>
                <span className="font-mono font-black text-[#162335]">{viewEmp.employeeId}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-400">Full Name</span>
                <span className="font-bold text-[#162335]">{viewEmp.fullName}</span>
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
                <span className="font-mono font-bold text-amber-600">{viewEmp.temporaryPassword || viewEmp.password || "••••••••"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-400">Phone</span>
                <span className="text-slate-800">{viewEmp.phone}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-400">Role</span>
                <span className="font-semibold">{viewEmp.role} {viewEmp.department ? `- ${viewEmp.department}` : ''}</span>
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
                <div className="flex flex-col gap-1 pt-1 border-b pb-2">
                  <span className="font-bold text-slate-400">Address</span>
                  <span className="text-slate-800 break-words">{viewEmp.address}</span>
                </div>
              )}

              {/* Bank Details Section */}
              <div className="pt-2">
                <div className="flex items-center gap-1.5 mb-3 text-[#162335]">
                  <Building2 size={16} />
                  <h4 className="font-black text-sm uppercase tracking-wider">Bank Details</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="font-bold text-slate-400 text-[11px]">Bank Name</span>
                    <span className="font-semibold text-slate-800">{viewEmp.bankName || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="font-bold text-slate-400 text-[11px]">Account Holder</span>
                    <span className="font-semibold text-slate-800">{viewEmp.accountHolderName || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="font-bold text-slate-400 text-[11px]">Account Number</span>
                    <span className="font-mono font-bold text-[#162335]">{viewEmp.accountNumber || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400 text-[11px]">IFSC Code</span>
                    <span className="font-mono font-bold text-[#162335]">{viewEmp.ifscCode || "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={() => setViewEmp(null)} className="w-full mt-5 py-2.5 bg-[#162335] text-white font-bold rounded-xl text-xs uppercase">
              Close
            </button>
          </div>
        </div>
      )}


      {/* 2. EDIT DETAILS MODAL */}
      {editEmpModalId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <AddEmployee 
              modalEditEmpId={editEmpModalId} 
              onSuccess={() => {
                setEditEmpModalId(null);
                setSuccessMsg("Employee updated successfully.");
                fetchEmployees();
              }}
              onCancel={() => setEditEmpModalId(null)}
            />
          </div>
        </div>
      )}

    </div>
  );
}