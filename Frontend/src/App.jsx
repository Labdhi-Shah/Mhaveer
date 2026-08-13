import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from "./Page/Login";
import { AuthProvider } from "./context/AuthContext";
import DashboardLayout from "./components/DashboardLayout";
import TeamPerformanceView from "./components/TeamPerformanceView";
import NewLeadView from "./components/NewLeadView";
import MyLeadsView from "./components/MyLeadsView";
import FollowUpView from "./components/FollowUpView";
import MeetingsView from "./components/MeetingsView";
import AttendanceView from "./components/AttendanceView";
import ProfileView from "./components/ProfileView";
import AdminDashboard from "./Page/AdminDashboard";
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

const DepartmentRoleProtectedRoute = ({ children, allowedDepartments = [], allowedRoles = [], excludedDepartments = [] }) => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);
    const userDepartment = getUserDepartment(user);
    const rawDepartment = user.department || user.dept || user.departmentName || "";
    const userRole = getUserRole(user);
    
    if (excludedDepartments.length > 0) {
      const isExcluded = excludedDepartments.some(dep => rawDepartment.toLowerCase().includes(dep.toLowerCase()));
      if (isExcluded) {
        return <Navigate to={getDepartmentRoute(user)} replace />;
      }
    }

    const departmentAllowed = allowedDepartments.length === 0 || allowedDepartments.includes(userDepartment);
    const roleAllowed = allowedRoles.length === 0 || allowedRoles.includes(userRole);

    if (!departmentAllowed || !roleAllowed) {
      return <Navigate to={getDepartmentRoute(user)} replace />;
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

          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute>
                <DepartmentRoleProtectedRoute allowedDepartments={["Admin"]} allowedRoles={["Admin"]}>
                  <AdminDashboard />
                </DepartmentRoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <DepartmentRoleProtectedRoute allowedDepartments={["Admin"]} allowedRoles={["Admin"]}>
                  <AdminDashboard />
                </DepartmentRoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-employee"
            element={
              <ProtectedRoute>
                <DepartmentRoleProtectedRoute allowedDepartments={["Admin"]} allowedRoles={["Admin"]}>
                  <AdminDashboard />
                </DepartmentRoleProtectedRoute>
              </ProtectedRoute>
            }
          />

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
              path="sales/manager"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Sales"]} allowedRoles={["Manager"]}>
                  <DepartmentRoleDashboard />
                </DepartmentRoleProtectedRoute>
              }
            />
            <Route
              path="sales/team-leader"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Sales"]} allowedRoles={["Team Leader"]}>
                  <DepartmentRoleDashboard />
                </DepartmentRoleProtectedRoute>
              }
            />
            <Route
              path="sales/employee"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Sales"]} allowedRoles={["Employee"]}>
                  <DepartmentRoleDashboard />
                </DepartmentRoleProtectedRoute>
              }
            />

            <Route
              path="telecalling/manager"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Telecalling"]} allowedRoles={["Manager"]}>
                  <DepartmentRoleDashboard />
                </DepartmentRoleProtectedRoute>
              }
            />
            <Route
              path="telecalling/team-leader"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Telecalling"]} allowedRoles={["Team Leader"]}>
                  <DepartmentRoleDashboard />
                </DepartmentRoleProtectedRoute>
              }
            />
            <Route
              path="telecalling/employee"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Telecalling"]} allowedRoles={["Employee"]}>
                  <DepartmentRoleDashboard />
                </DepartmentRoleProtectedRoute>
              }
            />

            <Route
              path="leads/manager"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Leads"]} allowedRoles={["Manager"]}>
                  <DepartmentRoleDashboard />
                </DepartmentRoleProtectedRoute>
              }
            />
            <Route
              path="leads/team-leader"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Leads"]} allowedRoles={["Team Leader"]}>
                  <DepartmentRoleDashboard />
                </DepartmentRoleProtectedRoute>
              }
            />
            <Route
              path="leads/employee"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Leads"]} allowedRoles={["Employee"]}>
                  <DepartmentRoleDashboard />
                </DepartmentRoleProtectedRoute>
              }
            />

            <Route
              path="sales-dashboard"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Sales"]}>
                  <DepartmentRoleDashboard />
                </DepartmentRoleProtectedRoute>
              }
            />
            <Route
              path="team-leader-dashboard"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Telecalling", "Sales", "Leads"]} allowedRoles={["Manager", "Team Leader"]}>
                  <DepartmentRoleDashboard />
                </DepartmentRoleProtectedRoute>
              }
            />
            <Route
              path="hr-dashboard"
              element={<Navigate to="/dashboard" replace />}
            />

            <Route
              path="team-performance"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Telecalling", "Sales", "Leads"]} allowedRoles={["Manager", "Team Leader", "Admin"]}>
                  <TeamPerformanceView />
                </DepartmentRoleProtectedRoute>
              }
            />

            <Route 
              path="new-lead" 
              element={
                <DepartmentRoleProtectedRoute excludedDepartments={["KYC", "Compliance"]}>
                  <NewLeadView />
                </DepartmentRoleProtectedRoute>
              } 
            />
            <Route 
              path="my-leads" 
              element={
                <DepartmentRoleProtectedRoute excludedDepartments={["KYC", "Compliance"]}>
                  <MyLeadsView />
                </DepartmentRoleProtectedRoute>
              } 
            />
            <Route 
              path="follow-up" 
              element={
                <DepartmentRoleProtectedRoute excludedDepartments={["KYC", "Compliance"]}>
                  <FollowUpView />
                </DepartmentRoleProtectedRoute>
              } 
            />
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
