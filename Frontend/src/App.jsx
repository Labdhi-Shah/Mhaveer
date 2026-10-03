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
import CreditFilesList from "./components/CreditDashboard/CreditFilesList";
import CreditFileDetails from "./components/CreditDashboard/CreditFileDetails";
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
      const fallbackRoute = getDepartmentRoute(user);
      if (window.location.pathname === fallbackRoute) {
        return (
          <div className="p-8 text-center">
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-6 rounded-2xl inline-block max-w-lg">
              <h2 className="text-xl font-black mb-2">Access Denied</h2>
              <p className="text-sm font-medium">Your department/role does not have access to this page.</p>
              <p className="text-xs mt-2 opacity-80">
                Found Department: {userDepartment || "None"}<br/>
                Found Role: {userRole || "None"}<br/>
                Expected: {allowedDepartments.join(',')} / {allowedRoles.join(',')}
              </p>
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

          <Route path="/admin-dashboard" element={<Navigate to="/dashboard" replace />} />

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
                <DepartmentRoleProtectedRoute allowedDepartments={["Telecalling", "Admin"]} allowedRoles={["Manager", "Admin"]}>
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
              path="credit/manager"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Credit"]} allowedRoles={["Manager"]}>
                  <DepartmentRoleDashboard />
                </DepartmentRoleProtectedRoute>
              }
            />
            <Route
              path="credit/team-leader"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Credit"]} allowedRoles={["Team Leader"]}>
                  <DepartmentRoleDashboard />
                </DepartmentRoleProtectedRoute>
              }
            />
            <Route
              path="credit/employee"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Credit"]} allowedRoles={["Employee"]}>
                  <DepartmentRoleDashboard />
                </DepartmentRoleProtectedRoute>
              }
            />

            <Route
              path="credit/files"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Credit", "Admin"]}>
                  <CreditFilesList />
                </DepartmentRoleProtectedRoute>
              }
            />
            <Route
              path="credit/files/:id"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Credit", "Admin"]}>
                  <CreditFileDetails />
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
              path="telecalling/employees"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Telecalling", "Admin"]}>
                  <EmployeeManagementView activeTab="list" />
                </DepartmentRoleProtectedRoute>
              }
            />
            <Route
              path="telecalling/add-employee"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Telecalling", "Admin"]}>
                  <EmployeeManagementView activeTab="add" />
                </DepartmentRoleProtectedRoute>
              }
            />
            <Route
              path="telecalling/employee-management"
              element={<Navigate to="/telecalling/employees" replace />}
            />
            <Route
              path="employees"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Telecalling", "Admin"]}>
                  <EmployeeManagementView activeTab="list" />
                </DepartmentRoleProtectedRoute>
              }
            />
            <Route
              path="add-employee"
              element={
                <DepartmentRoleProtectedRoute allowedDepartments={["Telecalling", "Admin"]}>
                  <EmployeeManagementView activeTab="add" />
                </DepartmentRoleProtectedRoute>
              }
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