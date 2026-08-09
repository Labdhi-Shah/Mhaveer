import { useState } from "react";
import Header from "../Header";
import Sidebar from "../Sidebar";
import DashboardView from "../DashboardView";
import AddEmployee from "../AddEmployee";
import EmployeeList from "../EmployeeList";
import { useLocation } from "react-router-dom";

export default function AdminDashboard() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <Header />
      <div className="flex flex-1 pt-16">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 md:p-8 bg-slate-100 overflow-y-auto">
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