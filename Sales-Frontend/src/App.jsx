import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SalesLogin from "./pages/SalesLogin";
import SalesLayout from "./components/SalesLayout";
import SalesDashboard from "./pages/SalesDashboard";
import SalesLeads from "./pages/SalesLeads";
import SalesCustomers from "./pages/SalesCustomers";
import SalesFollowUp from "./pages/SalesFollowUp";
import SalesMeetings from "./pages/SalesMeetings";
import SalesPipeline from "./pages/SalesPipeline";
import SalesReports from "./pages/SalesReports";
import SalesProfile from "./pages/SalesProfile";
import SalesSettings from "./pages/SalesSettings";

// Protect Sales routes
const SalesProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("sales_token");
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/" element={<SalesLogin />} />

        {/* Protected Dashboard/Workspaces Portal */}
        <Route
          path="/"
          element={
            <SalesProtectedRoute>
              <SalesLayout />
            </SalesProtectedRoute>
          }
        >
          <Route path="dashboard" element={<SalesDashboard />} />
          <Route path="leads" element={<SalesLeads />} />
          <Route path="customers" element={<SalesCustomers />} />
          <Route path="follow-up" element={<SalesFollowUp />} />
          <Route path="meetings" element={<SalesMeetings />} />
          <Route path="pipeline" element={<SalesPipeline />} />
          <Route path="reports" element={<SalesReports />} />
          <Route path="profile" element={<SalesProfile />} />
          <Route path="settings" element={<SalesSettings />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
