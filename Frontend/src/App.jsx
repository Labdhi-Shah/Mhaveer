import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from "./Page/Login";
import { AuthProvider } from "./context/AuthContext";
import DashboardLayout from "./components/DashboardLayout";
import SalesDashboard from "./components/SalesDashboard/SalesDashboard";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);
    if (user.role !== "Sales Department") {
      localStorage.clear();
      return <Navigate to="/login" replace />;
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
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<SalesDashboard />} />
            <Route path="sales-dashboard" element={<SalesDashboard />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}