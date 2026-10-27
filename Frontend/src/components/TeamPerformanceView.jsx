import { useState, useEffect } from "react";
import { Search, ArrowUpDown, ChevronDown, ChevronUp, Download, Users, Loader2, X, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "./../api";
import { useAuth } from "../context/AuthContext";
import { getUserRole } from "../utils/hierarchy";
import socket from "../utils/socket";
import * as XLSX from "xlsx";
import { downloadXLSX } from "../utils/fileDownloader";

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
  const [toast, setToast] = useState(null);
  const [exportingAll, setExportingAll] = useState(false);
  const [exportingEmployee, setExportingEmployee] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fetchPerformanceData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const url = "/team-performance";
      const res = await api.get(url);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch team performance", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();

    if (!socket.connected) {
      socket.connect();
    }

    const handleUpdate = () => {
      fetchPerformanceData(false);
    };

    socket.on("data-updated", handleUpdate);
    socket.on("leads-updated", handleUpdate);
    socket.on("lead:created", handleUpdate);
    socket.on("lead:updated", handleUpdate);
    socket.on("lead:deleted", handleUpdate);
    socket.on("meetings-updated", handleUpdate);
    socket.on("meeting:created", handleUpdate);
    socket.on("meeting:updated", handleUpdate);
    socket.on("meeting:deleted", handleUpdate);

    return () => {
      socket.off("data-updated", handleUpdate);
      socket.off("leads-updated", handleUpdate);
      socket.off("lead:created", handleUpdate);
      socket.off("lead:updated", handleUpdate);
      socket.off("lead:deleted", handleUpdate);
      socket.off("meetings-updated", handleUpdate);
      socket.off("meeting:created", handleUpdate);
      socket.off("meeting:updated", handleUpdate);
      socket.off("meeting:deleted", handleUpdate);
    };
  }, []);

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

  const formatLeadForExcel = (lead, employeeName = "") => {
    return {
      "Lead ID": lead.leadId || "N/A",
      "Employee Name": employeeName || lead.employeeName || selectedEmployee?.name || "N/A",
      "Customer / Company Name": lead.companyName || "N/A",
      "Contact Person": lead.contactPerson || "N/A",
      "Phone Number": lead.phoneNumber || lead.phone || "N/A",
      "Date Added": lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-IN") : "N/A",
      "Loan Type": lead.loanType || "N/A",
      "Loan Amount (₹)": lead.loanAmount ? Number(lead.loanAmount) : "N/A",
      "Company Turnover": lead.companyTurnover || lead.yearlyIncome ? Number(lead.companyTurnover || lead.yearlyIncome) : "N/A",
      "Interested": lead.interested || "N/A",
      "Call Status": lead.callStatus || "N/A",
      "Meeting Date": lead.meetingDate ? new Date(lead.meetingDate).toLocaleDateString("en-IN") : "N/A",
      "Meeting Time": lead.meetingTime || "N/A",
      "Follow-Up Date": lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString("en-IN") : "N/A",
      "Follow-Up Time": lead.followUpTime || "N/A",
      "City": lead.city || "N/A",
      "State": lead.state || "N/A",
      "Address": lead.address || "N/A",
      "Remarks / Notes": lead.remarks || "N/A"
    };
  };

  const exportEmployeeLeadsToExcel = () => {
    if (!selectedEmployee || !employeeLeads.length) {
      showToast("No customer records found to export.", "error");
      return;
    }
    setExportingEmployee(true);
    try {
      const dataToExport = employeeLeads.map((lead) =>
        formatLeadForExcel(lead, selectedEmployee.name)
      );

      const ws = XLSX.utils.json_to_sheet(dataToExport);

      const colWidths = Object.keys(dataToExport[0] || {}).map((key) => {
        const maxContentLength = Math.max(
          key.length,
          ...dataToExport
            .map((row) =>
              String(row[key] !== undefined && row[key] !== null ? row[key] : "")
                .length
            )
            .slice(0, 50)
        );
        return { wch: Math.min(Math.max(maxContentLength + 3, 14), 40) };
      });
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      const safeSheetName = `${selectedEmployee.name.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 25)} Leads`;
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName || "Customers");

      const dateStr = new Date().toISOString().slice(0, 10);
      const safeFilename = selectedEmployee.name.replace(/[^a-zA-Z0-9_-]/g, "_");
      downloadXLSX(wb, `${safeFilename}_Customers_${dateStr}.xlsx`);

      showToast(`Exported ${dataToExport.length} customers for ${selectedEmployee.name} to Excel!`, "success");
    } catch (err) {
      console.error("Export employee leads error:", err);
      showToast("Failed to export customer records to Excel.", "error");
    } finally {
      setExportingEmployee(false);
    }
  };

  const exportTeamPerformanceToExcel = async () => {
    if (!filteredData.length) {
      showToast("No team performance data to export.", "error");
      return;
    }
    setExportingAll(true);
    try {
      // Sheet 1: Team Summary
      const summaryRows = filteredData.map((item) => ({
        "Employee Name": item.name,
        "Employee ID": item.employeeId || "N/A",
        "Total Calls": item.totalCalls || 0,
        "Today's Calls": item.todaysCalls || 0,
        "Interested Leads": item.interestedLeads || 0,
        "Pending Follow-ups": item.pendingFollowUps || 0,
        "Today's Meetings": item.todaysMeetings || 0,
        "Last Activity": item.lastActivity
          ? new Date(item.lastActivity).toLocaleDateString("en-IN")
          : "N/A"
      }));

      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      wsSummary["!cols"] = [
        { wch: 22 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 18 },
        { wch: 16 },
        { wch: 18 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsSummary, "Team Summary");

      // Sheet 2: All Employee Customers & Leads
      try {
        const leadPromises = filteredData.map(async (emp) => {
          try {
            const res = await api.get(`/team-performance/${emp.id}/leads`);
            if (res.data?.success && Array.isArray(res.data.data)) {
              return res.data.data.map((lead) => formatLeadForExcel(lead, emp.name));
            }
          } catch (e) {
            console.warn(`Could not fetch leads for ${emp.name}`, e);
          }
          return [];
        });

        const allLeadsArrays = await Promise.all(leadPromises);
        const allLeads = allLeadsArrays.flat();

        if (allLeads.length > 0) {
          const wsLeads = XLSX.utils.json_to_sheet(allLeads);
          const colWidths = Object.keys(allLeads[0] || {}).map((key) => {
            const maxContentLength = Math.max(
              key.length,
              ...allLeads
                .map((row) =>
                  String(row[key] !== undefined && row[key] !== null ? row[key] : "")
                    .length
                )
                .slice(0, 50)
            );
            return { wch: Math.min(Math.max(maxContentLength + 3, 14), 40) };
          });
          wsLeads["!cols"] = colWidths;
          XLSX.utils.book_append_sheet(wb, wsLeads, "Employee Customers");
        }
      } catch (leadErr) {
        console.warn("Could not enrich leads sheet:", leadErr);
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      downloadXLSX(wb, `Team_Performance_Report_${dateStr}.xlsx`);
      showToast("Team Performance and customer records exported to Excel!", "success");
    } catch (err) {
      console.error("Failed to export Team Performance:", err);
      showToast("Failed to export Excel file.", "error");
    } finally {
      setExportingAll(false);
    }
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
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border ${
              toast.type === "success" 
                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="text-emerald-600 shrink-0" size={18} />
            ) : (
              <AlertCircle className="text-rose-600 shrink-0" size={18} />
            )}
            <span className="text-xs font-black tracking-wide">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
              onClick={exportTeamPerformanceToExcel}
              disabled={exportingAll}
              className="flex items-center gap-2 px-4 py-2 bg-[#162335] text-white font-bold rounded-xl text-sm hover:bg-[#162335]/90 transition shadow-sm disabled:opacity-50 cursor-pointer"
              title="Download Team Performance and all employee customer records as an Excel spreadsheet"
            >
              {exportingAll ? (
                <Loader2 size={16} className="animate-spin text-[#9ca3af]" />
              ) : (
                <Download size={16} className="text-[#9ca3af]" />
              )}
              <span>{exportingAll ? "Exporting..." : "Export to Excel"}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50">
              <div>
                <h2 className="text-xl font-black text-[#162335] flex items-center gap-2">
                  <span>{selectedEmployee.name}'s Customers</span>
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Total Leads / Customers: <span className="font-bold text-[#162335]">{employeeLeads.length}</span>
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={exportEmployeeLeadsToExcel}
                  disabled={leadsLoading || employeeLeads.length === 0 || exportingEmployee}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Export this employee's customer list to Excel (.xlsx)"
                >
                  {exportingEmployee ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Download size={15} />
                  )}
                  <span>Export to Excel</span>
                </button>
                <button 
                  onClick={() => setSelectedEmployee(null)}
                  className="p-2 hover:bg-slate-200/70 rounded-xl transition text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
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
                        <th className="py-3 px-4 text-xs font-black text-[#162335] uppercase tracking-widest">Loan Type</th>
                        <th className="py-3 px-4 text-xs font-black text-[#162335] uppercase tracking-widest">Loan Amount</th>
                        <th className="py-3 px-4 text-xs font-black text-[#162335] uppercase tracking-widest">Date</th>
                        <th className="py-3 px-4 text-xs font-black text-[#162335] uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeLeads.map((lead) => (
                        <tr key={lead._id || lead.leadId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                          <td className="py-3 px-4 text-sm font-bold text-[#162335]">{lead.companyName}</td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-600">{lead.contactPerson}</td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-600">{lead.phoneNumber || lead.phone || "N/A"}</td>
                          <td className="py-3 px-4 text-xs font-semibold text-slate-500">{lead.loanType || "-"}</td>
                          <td className="py-3 px-4 text-sm font-black text-slate-700">
                            {lead.loanAmount ? `₹${Number(lead.loanAmount).toLocaleString("en-IN")}` : "N/A"}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-600">
                            {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-GB') : "N/A"}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                              lead.interested === "Yes" ? "bg-emerald-100 text-emerald-800" :
                              lead.interested === "No" ? "bg-rose-100 text-rose-800" :
                              "bg-amber-100 text-amber-800"
                            }`}>
                              {lead.interested || lead.callStatus || "Logged"}
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