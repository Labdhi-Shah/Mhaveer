import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from "./Page/Login";
import { AuthProvider } from "./context/AuthContext";
import DashboardLayout from "./components/DashboardLayout";
import DashboardSelector from "./components/DashboardSelector";
import EmployeeList from "./EmployeeList";
import AddEmployee from "./AddEmployee";
import MyLeadsView from "./components/MyLeadsView";
import FollowUpView from "./components/FollowUpView";
import MeetingsView from "./components/MeetingsView";
import ProfileView from "./components/ProfileView";

import EmployeeDashboard from "./components/EmployeeDashboard";
import NewLeadView from "./components/NewLeadView";
import AttendanceView from "./components/AttendanceView";
import TeamPerformanceView from "./components/TeamPerformanceView";

// Import Sales Department Module Components
import SalesLogin from "./components/SalesDepartment/SalesLogin";
import SalesLayout from "./components/SalesDepartment/SalesLayout";
import SalesDashboardPage from "./components/SalesDepartment/SalesDashboard";
import SalesLeads from "./components/SalesDepartment/SalesLeads";
import SalesCustomers from "./components/SalesDepartment/SalesCustomers";
import SalesRegistration from "./components/SalesDepartment/SalesRegistration";
import SalesFollowUp from "./components/SalesDepartment/SalesFollowUp";
import SalesMeetings from "./components/SalesDepartment/SalesMeetings";
import SalesPipeline from "./components/SalesDepartment/SalesPipeline";
import SalesReports from "./components/SalesDepartment/SalesReports";
import SalesProfile from "./components/SalesDepartment/SalesProfile";
import SalesSettings from "./components/SalesDepartment/SalesSettings";

import HRDashboard from "./Page/HRDashboard";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      if (user.role === "Sales Department") {
        return <Navigate to="/sales/dashboard" replace />;
      } else if (user.role === "Human Resources (HR)") {
        return <Navigate to="/hr/dashboard" replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  } catch (e) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Sales Department Isolated Portal */}
          <Route path="/sales/login" element={<SalesLogin />} />
          
          <Route
            path="/sales"
            element={
              <ProtectedRoute allowedRoles={["Sales Department"]}>
                <SalesLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SalesDashboardPage />} />
            <Route path="leads" element={<SalesLeads />} />
            <Route path="customers" element={<SalesCustomers />} />
            <Route path="registration" element={<SalesRegistration />} />
            <Route path="follow-up" element={<SalesFollowUp />} />
            <Route path="meetings" element={<SalesMeetings />} />
            <Route path="pipeline" element={<SalesPipeline />} />
            <Route path="reports" element={<SalesReports />} />
            <Route path="profile" element={<SalesProfile />} />
            <Route path="settings" element={<SalesSettings />} />
          </Route>

          {/* HR Department Portal */}
          <Route
            path="/hr"
            element={
              <ProtectedRoute allowedRoles={["Human Resources (HR)"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HRDashboard />} />
            <Route path="attendance" element={<AttendanceView />} />
            <Route path="profile" element={<ProfileView />} />
          </Route>

          {/* Existing CRM Portal routes (Admin, TL, Manager) */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={["Team Leader", "SuperAdmin", "Admin", "Manager", "Management"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardSelector />} />
            <Route path="new-lead" element={<NewLeadView />} />
            <Route path="my-leads" element={<MyLeadsView />} />
            <Route path="follow-up" element={<FollowUpView />} />
            <Route path="team-performance" element={<TeamPerformanceView />} />
            <Route path="meetings" element={<MeetingsView />} />
            <Route path="attendance" element={<AttendanceView />} />
            <Route path="profile" element={<ProfileView />} />

            <Route path="employees" element={<EmployeeList />} />
            <Route path="add-employee" element={<AddEmployee />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}