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

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
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
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
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