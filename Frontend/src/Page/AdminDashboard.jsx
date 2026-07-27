import { useState } from "react";
import Header from "../Header";
import Sidebar from "../Sidebar";
import DashboardView from "../DashboardView";
import AddEmployee from "../AddEmployee";
import EmployeeList from "../EmployeeList";
import { useLocation } from "react-router-dom";

export default function AdminDashboard() {
  const location = useLocation();
  const [employees, setEmployees] = useState([
    {
      id: "EMP0001",
      fullName: "Aisha Rahman",
      email: "aisha@mhaveerfincap.com",
      phone: "+91 98765 43210",
      role: "Relationship Manager (RM)",
      status: "Active",
    },
    {
      id: "EMP0002",
      fullName: "Rohan Verma",
      email: "rohan@mhaveerfincap.com",
      phone: "+91 91234 56789",
      role: "Credit / Underwriting",
      status: "Active",
    },
    {
      id: "EMP0003",
      fullName: "Meera Iyer",
      email: "meera@mhaveerfincap.com",
      phone: "+91 99887 66554",
      role: "KYC & Compliance",
      status: "Inactive",
    },
  ]);

  const handleAddEmployee = (newEmpData) => {
    const nextEmp = {
      id: `EMP${String(employees.length + 1).padStart(4, "0")}`,
      fullName: newEmpData.name,
      email: newEmpData.email,
      phone: newEmpData.phone,
      role: newEmpData.role,
      status: newEmpData.status,
    };
    setEmployees([nextEmp, ...employees]);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <Header />
      <div className="flex flex-1 pt-16">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 md:p-8 bg-slate-100 overflow-y-auto">
          {location.pathname === "/employees" ? (
            <EmployeeList employees={employees} />
          ) : location.pathname === "/add-employee" ? (
            <AddEmployee onAddEmployee={handleAddEmployee} />
          ) : (
            <DashboardView
              employees={employees}
              onOpenForm={() => window.location.pathname = "/add-employee"}
            />
          )}
        </main>
      </div>
    </div>
  );
}