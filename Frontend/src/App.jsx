import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from "./Page/Login";
import { AuthProvider } from "./context/AuthContext";
import DashboardLayout from "./components/DashboardLayout";
import SalesDashboard from "./components/SalesDashboard/SalesDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";
import DashboardView from "./DashboardView";
import EmployeeList from "./EmployeeList";
import AddEmployee from "./AddEmployee";
import TeamPerformanceView from "./components/TeamPerformanceView";
import NewLeadView from "./components/NewLeadView";
import MyLeadsView from "./components/MyLeadsView";
import FollowUpView from "./components/FollowUpView";
import MeetingsView from "./components/MeetingsView";
import AttendanceView from "./components/AttendanceView";
import ProfileView from "./components/ProfileView";

// Checks if the user is authenticated (token exists in localStorage)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Checks if the authenticated user has one of the allowed roles
const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);
    const userRole = user.role ? user.role.toLowerCase() : "";
    const isAuthorized = allowedRoles.some(role => {
      const targetRole = role.toLowerCase();
      if (userRole === targetRole) return true;
      if (targetRole === 'admin' && (userRole === 'administration (admin)' || userRole === 'superadmin' || userRole === 'admin')) return true;
      if (targetRole === 'hr' && (userRole === 'human resources (hr)' || userRole === 'hr')) return true;
      if (targetRole === 'sales' && (userRole === 'sales department' || userRole === 'sales')) return true;
      if (targetRole === 'team leader' && (userRole === 'team leader' || userRole === 'tl' || userRole === 'teamleader')) return true;
      return userRole.includes(targetRole) || targetRole.includes(userRole);
    });

    if (!isAuthorized) {
      // If not authorized for this specific dashboard/view, redirect to their main dashboard entrypoint
      return <Navigate to="/dashboard" replace />;
    }
  } catch (e) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Redirects /dashboard entrypoint to their respective role-specific dashboard
const DashboardRedirect = () => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);
    const role = user.role ? user.role.toLowerCase() : "";
    if (role === "sales department" || role === "sales") {
      return <Navigate to="/sales-dashboard" replace />;
    } else if (role === "team leader" || role === "tl" || role === "teamleader") {
      return <Navigate to="/team-leader-dashboard" replace />;
    } else if (role === "human resources (hr)" || role === "hr") {
      return <Navigate to="/hr-dashboard" replace />;
    } else if (role === "administration (admin)" || role === "admin" || role === "superadmin") {
      return <Navigate to="/admin-dashboard" replace />;
    } else {
      // Fallback dashboard
      return <Navigate to="/team-leader-dashboard" replace />;
    }
  } catch (e) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Entry point that redirects according to user role */}
            <Route path="dashboard" element={<DashboardRedirect />} />

            {/* Role-specific dashboard routes */}
            <Route
              path="sales-dashboard"
              element={
                <RoleProtectedRoute allowedRoles={["Sales"]}>
                  <SalesDashboard />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="team-leader-dashboard"
              element={
                <RoleProtectedRoute allowedRoles={["Team Leader", "Manager", "Telecalling / Lead Generation", "Reception / Front Desk", "Employee", "Operations Department", "Legal Department", "Accounts & Finance", "Collections & Recovery", "Customer Support", "Marketing", "IT Department", "Insurance Department"]}>
                  <EmployeeDashboard />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="hr-dashboard"
              element={
                <RoleProtectedRoute allowedRoles={["HR"]}>
                  <EmployeeDashboard />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin-dashboard"
              element={
                <RoleProtectedRoute allowedRoles={["Admin"]}>
                  <DashboardView />
                </RoleProtectedRoute>
              }
            />

            {/* Administrative management routes */}
            <Route
              path="employees"
              element={
                <RoleProtectedRoute allowedRoles={["Admin"]}>
                  <EmployeeList />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="add-employee"
              element={
                <RoleProtectedRoute allowedRoles={["Admin"]}>
                  <AddEmployee />
                </RoleProtectedRoute>
              }
            />

            {/* Team performance routes */}
            <Route
              path="team-performance"
              element={
                <RoleProtectedRoute allowedRoles={["Team Leader", "Manager", "Admin"]}>
                  <TeamPerformanceView />
                </RoleProtectedRoute>
              }
            />

            {/* General CRM routes */}
            <Route path="new-lead" element={<NewLeadView />} />
            <Route path="my-leads" element={<MyLeadsView />} />
            <Route path="follow-up" element={<FollowUpView />} />
            <Route path="meetings" element={<MeetingsView />} />
            <Route path="attendance" element={<AttendanceView />} />
            <Route path="profile" element={<ProfileView />} />

            {/* Wildcard fallback redirects to core dashboard entrypoint */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}