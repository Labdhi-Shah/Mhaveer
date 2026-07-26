import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { X } from "lucide-react";
import LoginPage from "./LoginPage";
import Header from "./Header";
import Sidebar from "./Sidebar";
import DashboardView from "./DashboardView";
import EmployeeList from "./EmployeeList";
import AddEmployee from "./AddEmployee";
import { AuthProvider, useAuth } from "./context/AuthContext";

const initialEmployees = [
  {
    id: "EMP0001",
    fullName: "Aisha Rahman",
    email: "aisha@loanportal.com",
    phone: "+91 98765 43210",
    role: "Relationship Manager (RM)",
    department: "Sales",
    status: "Active",
    createdAt: "2026-07-21T10:00:00.000Z",
  },
  {
    id: "EMP0002",
    fullName: "Rohan Verma",
    email: "rohan@loanportal.com",
    phone: "+91 91234 56789",
    role: "Credit / Underwriting",
    department: "Operations",
    status: "Active",
    createdAt: "2026-07-18T09:30:00.000Z",
  },
  {
    id: "EMP0003",
    fullName: "Meera Iyer",
    email: "meera@loanportal.com",
    phone: "+91 99887 66554",
    role: "KYC & Compliance",
    department: "Compliance",
    status: "Inactive",
    createdAt: "2026-07-12T08:15:00.000Z",
  },
];

function AppShell({ children, user, onLogout }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#07132b] text-slate-200">
      <Header user={user} onLogout={onLogout} />
      <div className="flex">
        <Sidebar currentPath={location.pathname} />
        <main className="flex-1 px-4 pb-10 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState(initialEmployees);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleAddEmployee = (employee) => {
    setEmployees((current) => [employee, ...current]);
  };

  const handleToggleStatus = (id) => {
    setEmployees((current) =>
      current.map((employee) =>
        employee.id === id
          ? { ...employee, status: employee.status === "Active" ? "Inactive" : "Active" }
          : employee
      )
    );
  };

  const handleDelete = (id) => {
    setEmployees((current) => current.filter((employee) => employee.id !== id));
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppShell user={user} onLogout={handleLogout}>
                <DashboardView employees={employees} />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/list"
          element={
            <ProtectedRoute>
              <AppShell user={user} onLogout={handleLogout}>
                <EmployeeList
                  employees={employees}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDelete}
                  onViewDetails={setSelectedEmployee}
                />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/add"
          element={
            <ProtectedRoute>
              <AppShell user={user} onLogout={handleLogout}>
                <AddEmployee employees={employees} onAddEmployee={handleAddEmployee} />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="/*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>

      {selectedEmployee ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-indigo-300">Employee Details</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{selectedEmployee.fullName}</h3>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="rounded-full border border-white/10 bg-slate-800/70 p-2 text-slate-300 transition hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-3 text-sm text-slate-300">
              <div className="flex justify-between rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3">
                <span className="text-slate-400">Employee ID</span>
                <span className="font-semibold text-white">{selectedEmployee.id}</span>
              </div>
              <div className="flex justify-between rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3">
                <span className="text-slate-400">Email</span>
                <span className="font-semibold text-white">{selectedEmployee.email}</span>
              </div>
              <div className="flex justify-between rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3">
                <span className="text-slate-400">Phone</span>
                <span className="font-semibold text-white">{selectedEmployee.phone}</span>
              </div>
              <div className="flex justify-between rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3">
                <span className="text-slate-400">Role</span>
                <span className="font-semibold text-white">{selectedEmployee.role}</span>
              </div>
              <div className="flex justify-between rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3">
                <span className="text-slate-400">Status</span>
                <span className="font-semibold text-emerald-300">{selectedEmployee.status}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;