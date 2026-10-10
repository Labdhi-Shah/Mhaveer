import { useState, useEffect } from "react";
import { Search, ArrowUpDown, ChevronDown, ChevronUp, Download, Users, Loader2, X } from "lucide-react";
import api from "./../api";
import { useAuth } from "../context/AuthContext";
import { getUserRole } from "../utils/hierarchy";

export default function TeamPerformanceView() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  
  // Modal state
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeLeads, setEmployeeLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const url = "/team-performance";
      const res = await api.get(url);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch team performance", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const filteredData = sortedData.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const exportToCSV = () => {
    if (!filteredData.length) return;
    const headers = ["Name", "Total Calls", "Today's Calls", "Interested Leads", "Pending Follow-ups", "Today's Meetings", "Last Activity"];
    
    const rows = filteredData.map(item => {
      const row = [item.name, item.totalCalls, item.todaysCalls, item.interestedLeads, item.pendingFollowUps, item.todaysMeetings, item.lastActivity ? new Date(item.lastActivity).toLocaleDateString() : "N/A"];
      return row.join(",");
    });
    
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `TeamPerformance_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const handleEmployeeClick = async (employee) => {
    setSelectedEmployee(employee);
    setLeadsLoading(true);
    try {
      const res = await api.get(`/team-performance/${employee.id}/leads`);
      if (res.data.success) {
        setEmployeeLeads(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch employee leads", error);
    } finally {
      setLeadsLoading(false);
    }
  };

  const role = getUserRole(user);
  if (role !== "Manager") {
    return <div className="p-8 text-center font-bold text-red-500">Access Denied</div>;
  }

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="opacity-40" />;
    return sortConfig.direction === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#162335] flex items-center gap-3">
              <Users className="text-[#9ca3af]" size={28} />
              Team Performance
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Monitor leads and follow-ups across your team.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#162335] text-white font-bold rounded-xl text-sm hover:bg-[#162335]/90 transition shadow-sm"
            >
              <Download size={16} className="text-[#9ca3af]" />
              Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search Employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#9ca3af]/30 transition"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th 
                    className="py-4 px-6 text-xs font-black text-[#162335] uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">Name {renderSortIcon("name")}</div>
                  </th>
                  <th 
                    className="py-4 px-6 text-xs font-black text-[#162335] uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => handleSort("totalCalls")}
                  >
                    <div className="flex items-center gap-2">Total Calls {renderSortIcon("totalCalls")}</div>
                  </th>
                  <th 
                    className="py-4 px-6 text-xs font-black text-[#162335] uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => handleSort("todaysCalls")}
                  >
                    <div className="flex items-center gap-2">Today's Calls {renderSortIcon("todaysCalls")}</div>
                  </th>
                  <th 
                    className="py-4 px-6 text-xs font-black text-[#162335] uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => handleSort("interestedLeads")}
                  >
                    <div className="flex items-center gap-2">Interested Leads {renderSortIcon("interestedLeads")}</div>
                  </th>
                  <th 
                    className="py-4 px-6 text-xs font-black text-[#162335] uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => handleSort("pendingFollowUps")}
                  >
                    <div className="flex items-center gap-2">Pending Follow-ups {renderSortIcon("pendingFollowUps")}</div>
                  </th>
                  <th 
                    className="py-4 px-6 text-xs font-black text-[#162335] uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => handleSort("todaysMeetings")}
                  >
                    <div className="flex items-center gap-2">Today's Meetings {renderSortIcon("todaysMeetings")}</div>
                  </th>
                  <th 
                    className="py-4 px-6 text-xs font-black text-[#162335] uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => handleSort("lastActivity")}
                  >
                    <div className="flex items-center gap-2">Last Activity {renderSortIcon("lastActivity")}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <Loader2 className="w-8 h-8 text-[#9ca3af] animate-spin mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-400">Loading performance data...</p>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="text-slate-300" size={32} />
                      </div>
                      <p className="text-sm font-bold text-[#162335]">No records found</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">Try adjusting your search</p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item) => (
                    <tr 
                      key={item.id} 
                      className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#162335]/5 flex items-center justify-center font-bold text-[#162335] text-xs">
                            {item.name.charAt(0)}
                          </div>
                          <div>
                            <button 
                              onClick={() => handleEmployeeClick(item)}
                              className="text-sm font-black text-[#162335] hover:text-blue-600 transition text-left"
                            >
                              {item.name}
                            </button>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-black text-slate-600">{item.totalCalls}</td>
                      <td className="py-4 px-6 text-sm font-black text-slate-600">{item.todaysCalls}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${item.interestedLeads > 0 ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}>
                          {item.interestedLeads}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${item.pendingFollowUps > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"}`}>
                          {item.pendingFollowUps}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${item.todaysMeetings > 0 ? "bg-purple-50 text-purple-600" : "bg-slate-50 text-slate-400"}`}>
                          {item.todaysMeetings}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs font-bold text-slate-500">
                        {item.lastActivity ? new Date(item.lastActivity).toLocaleDateString('en-GB') : "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-xs font-bold text-slate-500">
                Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Employee Leads Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-[#162335]">
                  {selectedEmployee.name}'s Customers
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Total Leads: {employeeLeads.length}
                </p>
              </div>
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {leadsLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 text-[#9ca3af] animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">Loading customers...</p>
                </div>
              ) : employeeLeads.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="text-slate-300" size={32} />
                  </div>
                  <p className="text-sm font-bold text-[#162335]">No customers found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="py-3 px-4 text-xs font-black text-[#162335] uppercase tracking-widest">Customer Name</th>
                        <th className="py-3 px-4 text-xs font-black text-[#162335] uppercase tracking-widest">Contact Person</th>
                        <th className="py-3 px-4 text-xs font-black text-[#162335] uppercase tracking-widest">Phone</th>
                        <th className="py-3 px-4 text-xs font-black text-[#162335] uppercase tracking-widest">Date</th>
                        <th className="py-3 px-4 text-xs font-black text-[#162335] uppercase tracking-widest">Loan Amount</th>
                        <th className="py-3 px-4 text-xs font-black text-[#162335] uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeLeads.map((lead) => (
                        <tr key={lead._id || lead.leadId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                          <td className="py-3 px-4 text-sm font-bold text-[#162335]">{lead.companyName}</td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-600">{lead.contactPerson}</td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-600">{lead.phoneNumber}</td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-600">
                            {new Date(lead.createdAt).toLocaleDateString('en-GB')}
                          </td>
                          <td className="py-3 px-4 text-sm font-black text-slate-600">
                            {lead.loanAmount ? `₹${lead.loanAmount.toLocaleString()}` : "N/A"}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex px-2 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600">
                              {lead.interested}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}