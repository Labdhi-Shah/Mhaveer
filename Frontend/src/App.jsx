import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from "./Page/Login";
import ForgotPassword from "./Page/ForgotPassword";
import { AuthProvider } from "./context/AuthContext";
import DashboardLayout from "./components/DashboardLayout";
import TeamPerformanceView from "./components/TeamPerformanceView";
import NewLeadView from "./components/NewLeadView";
import MyLeadsView from "./components/MyLeadsView";
import FollowUpView from "./components/FollowUpView";
import MeetingsView from "./components/MeetingsView";
import AttendanceView from "./components/AttendanceView";
import ProfileView from "./components/ProfileView";
import EmployeeManagementView from "./components/EmployeeManagementView";
import DepartmentRoleDashboard from "./components/DepartmentRoleDashboard";
import { getDepartmentRoute, getUserDepartment, getUserRole } from "./utils/hierarchy";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  return children;
};

const DepartmentRoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);
    const userRole = getUserRole(user);
    
    const roleAllowed = allowedRoles.length === 0 || allowedRoles.includes(userRole);

    if (!roleAllowed) {
      const fallbackRoute = getDepartmentRoute(user);
      if (window.location.pathname === fallbackRoute) {
        return (
          <div className="p-8 text-center">
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-6 rounded-2xl inline-block max-w-lg">
              <h2 className="text-xl font-black mb-2">Access Denied</h2>
              <p className="text-sm font-medium">Your role does not have access to this page.</p>
            </div>
          </div>
        );
      }
      return <Navigate to={fallbackRoute} replace />;
    }

    return children;
  } catch {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
};

const DashboardRedirect = () => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);
    return <Navigate to={getDepartmentRoute(user)} replace />;
  } catch {
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
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardRedirect />} />

            <Route
              path="telecalling/manager"
              element={
                <DepartmentRoleProtectedRoute allowedRoles={["Manager"]}>
                  <DepartmentRoleDashboard />
                </DepartmentRoleProtectedRoute>
              }
            />
            <Route
              path="telecalling/employee"
              element={
                <DepartmentRoleProtectedRoute allowedRoles={["Employee"]}>
                  <DepartmentRoleDashboard />
                </DepartmentRoleProtectedRoute>
              }
            />

            <Route
              path="telecalling/employees"
              element={
                <DepartmentRoleProtectedRoute allowedRoles={["Manager"]}>
                  <EmployeeManagementView activeTab="list" />
                </DepartmentRoleProtectedRoute>
              }
            />
            <Route
              path="telecalling/add-employee"
              element={
                <DepartmentRoleProtectedRoute allowedRoles={["Manager"]}>
                  <EmployeeManagementView activeTab="add" />
                </DepartmentRoleProtectedRoute>
              }
            />
            <Route
              path="telecalling/employee-management"
              element={<Navigate to="/telecalling/employees" replace />}
            />

            <Route
              path="team-performance"
              element={
                <DepartmentRoleProtectedRoute allowedRoles={["Manager"]}>
                  <TeamPerformanceView />
                </DepartmentRoleProtectedRoute>
              }
            />

            <Route path="new-lead" element={<NewLeadView />} />
            <Route path="my-leads" element={<MyLeadsView />} />
            <Route path="follow-up" element={<FollowUpView />} />
            <Route path="meetings" element={<MeetingsView />} />
            <Route path="attendance" element={<AttendanceView />} />
            <Route path="profile" element={<ProfileView />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}