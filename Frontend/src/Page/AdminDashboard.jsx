import { useState } from "react";
import Header from "../Header";
import Sidebar from "../Sidebar";
import DashboardView from "../DashboardView";
import AddEmployee from "../AddEmployee";
import EmployeeList from "../EmployeeList";
import { useLocation } from "react-router-dom";

export default function AdminDashboard() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 pt-16">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 ml-0 md:ml-64 p-4 sm:p-6 md:p-8 bg-slate-100 overflow-y-auto transition-all duration-300">
          {location.pathname === "/employees" ? (
            <EmployeeList />
          ) : location.pathname === "/add-employee" ? (
            <AddEmployee />
          ) : (
            <DashboardView
              onOpenForm={() => window.location.pathname = "/add-employee"}
            />
          )}
        </main>
      </div>
    </div>
  );
}