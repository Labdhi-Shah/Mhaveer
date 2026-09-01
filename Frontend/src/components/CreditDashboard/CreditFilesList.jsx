import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { Search, Eye, Filter } from "lucide-react";

export default function CreditFilesList() {
  const [files, setFiles] = parseInt(useState([]), 10) ? [] : useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await api.get("/credit/files");
      if (res.data.success) {
        setFiles(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching credit files:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter(f => 
    f.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.creditStatus?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0a2540]">Loan Files</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage and review all assigned credit applications</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a2540]"
            />
          </div>
          <button className="bg-white border border-slate-200 p-2 rounded-xl text-slate-600 hover:bg-slate-50">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8">Loading files...</td></tr>
              ) : filteredFiles.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8">No files found.</td></tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr key={file._id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#0a2540]">{file.fullName}</p>
                      <p className="text-xs text-slate-400">{file.email}</p>
                      <p className="text-xs text-slate-400">{file.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        file.creditStatus === "New" ? "bg-yellow-100 text-yellow-700" :
                        file.creditStatus === "Pending Verification" ? "bg-orange-100 text-orange-700" :
                        file.creditStatus === "Verification Completed" ? "bg-indigo-100 text-indigo-700" :
                        file.creditStatus === "Approved" ? "bg-green-100 text-green-700" :
                        file.creditStatus === "Rejected" ? "bg-red-100 text-red-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {file.creditStatus || "New"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">{file.creditAssignedEmployeeName || "Unassigned"}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {new Date(file.updatedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => navigate(`/credit/files/${file._id}`)}
                        className="bg-slate-100 hover:bg-[#0a2540] hover:text-white text-slate-600 p-2 rounded-lg transition"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
