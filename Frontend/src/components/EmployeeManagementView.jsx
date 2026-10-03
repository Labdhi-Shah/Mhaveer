import { useNavigate, useLocation } from "react-router-dom";
import { Users, UserPlus } from "lucide-react";
import AddEmployee from "../AddEmployee";
import EmployeeList from "../EmployeeList";

export default function EmployeeManagementView({ activeTab: propTab }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from prop or current pathname
  const isAddRoute = location.pathname.includes("add-employee");
  const currentTab = propTab || (isAddRoute ? "add" : "list");

  const handleTabChange = (tab) => {
    if (tab === "list") {
      navigate("/telecalling/employees");
    } else {
      navigate("/telecalling/add-employee");
    }
  };

  return (
    <div className="space-y-6">
      {/* Telecalling Portal Employee Management Header */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-[#0a2540] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#d4af37]">
            Telecalling Portal
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-[#0a2540] mt-1">
            Employee Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization directory, employee roles, team assignments, and onboarding.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto w-full md:w-auto">
          <button
            type="button"
            onClick={() => handleTabChange("list")}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentTab === "list"
                ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                : "text-slate-600 hover:text-[#0a2540] hover:bg-white/60"
            }`}
          >
            <Users size={16} />
            <span>Employee List</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("add")}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentTab === "add"
                ? "bg-[#0a2540] text-[#d4af37] shadow-md font-black"
                : "text-slate-600 hover:text-[#0a2540] hover:bg-white/60"
            }`}
          >
            <UserPlus size={16} />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Active View Component */}
      <div>
        {currentTab === "add" ? (
          <AddEmployee />
        ) : (
          <EmployeeList />
        )}
      </div>
    </div>
  );
}
