import React, { useState } from 'react';
import { FileText, Plus, User, Phone, CheckCircle2, Search, Filter } from 'lucide-react';

const mockEmployees = [
  { id: 1, name: "Alice Smith", role: "Telecaller" },
  { id: 2, name: "Bob Jones", role: "Telecaller" },
  { id: 3, name: "Charlie Brown", role: "Telecaller" }
];

const mockInitialTasks = [
  {
    id: 1,
    employeeId: 1,
    employeeName: "Alice Smith",
    targetCalls: 50,
    listDetails: "Q3 Real Estate Leads - High Priority",
    assignedDate: "2026-10-06",
    status: "Active"
  },
  {
    id: 2,
    employeeId: 2,
    employeeName: "Bob Jones",
    targetCalls: 30,
    listDetails: "Follow up with last week's non-responsive leads",
    assignedDate: "2026-10-05",
    status: "Active"
  }
];

export default function DocumentsView() {
  const [tasks, setTasks] = useState(mockInitialTasks);
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    employeeId: "",
    targetCalls: "",
    listDetails: ""
  });

  const handleAssignTask = (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.targetCalls || !formData.listDetails) return;

    const employee = mockEmployees.find(emp => emp.id === parseInt(formData.employeeId));
    
    const newTask = {
      id: Date.now(),
      employeeId: employee.id,
      employeeName: employee.name,
      targetCalls: parseInt(formData.targetCalls),
      listDetails: formData.listDetails,
      assignedDate: new Date().toISOString().split('T')[0],
      status: "Active"
    };

    setTasks([newTask, ...tasks]);
    setFormData({ employeeId: "", targetCalls: "", listDetails: "" });
    setIsAssigning(false);
  };

  const filteredTasks = tasks.filter(task => 
    task.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.listDetails.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#0a2540] flex items-center gap-3">
            <FileText className="text-[#d4af37]" size={32} />
            Documents & Calling Lists
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage and assign calling lists to your team members.</p>
        </div>
        <button 
          onClick={() => setIsAssigning(!isAssigning)}
          className="bg-[#0a2540] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#113255] transition shadow-md"
        >
          {isAssigning ? "Cancel Assignment" : <><Plus size={20} /> Assign New List</>}
        </button>
      </div>

      {isAssigning && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold text-[#0a2540] mb-6 flex items-center gap-2">
            <User className="text-[#d4af37]" size={24} />
            Assign New Calling List
          </h2>
          <form onSubmit={handleAssignTask} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Select Employee</label>
              <select 
                value={formData.employeeId}
                onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] outline-none transition font-medium text-slate-700"
                required
              >
                <option value="">Choose an employee...</option>
                {mockEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Target Calling Count</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="number" 
                  min="1"
                  value={formData.targetCalls}
                  onChange={(e) => setFormData({...formData, targetCalls: e.target.value})}
                  className="w-full pl-10 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] outline-none transition font-medium text-slate-700"
                  placeholder="e.g., 50"
                  required
                />
              </div>
            </div>
            <div className="space-y-2 lg:col-span-3">
              <label className="text-sm font-bold text-slate-700">List/Task Details</label>
              <textarea 
                value={formData.listDetails}
                onChange={(e) => setFormData({...formData, listDetails: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] outline-none transition font-medium text-slate-700 min-h-[100px]"
                placeholder="Provide link to document, CRM filter, or description of the calling list..."
                required
              />
            </div>
            <div className="lg:col-span-3 flex justify-end">
              <button 
                type="submit"
                className="bg-[#d4af37] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#c19b2e] transition shadow-md"
              >
                <CheckCircle2 size={20} />
                Confirm Assignment
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
          <h3 className="text-lg font-bold text-[#0a2540]">Active Assigned Lists</h3>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 p-2.5 rounded-lg border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-[#0a2540]/20 outline-none"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Employee</th>
                <th className="p-4 font-bold">List Details</th>
                <th className="p-4 font-bold text-center">Target Calls</th>
                <th className="p-4 font-bold">Assigned On</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="font-bold text-[#0a2540]">{task.employeeName}</div>
                    </td>
                    <td className="p-4 max-w-md">
                      <div className="text-sm font-medium text-slate-600 line-clamp-2">
                        {task.listDetails}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold border border-blue-100">
                        {task.targetCalls}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-slate-500">{task.assignedDate}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {task.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500 font-medium">
                    No assigned lists found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
