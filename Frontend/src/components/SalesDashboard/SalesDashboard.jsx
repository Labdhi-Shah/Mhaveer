/**
 * SalesDashboard.jsx
 *
 * Role-based dispatcher for the Sales Department dashboard.
 * Renders the correct dashboard based on the authenticated user's role:
 *
 *  Sales + Manager      → SalesManagerDashboard
 *  Sales + Team Leader  → SalesTeamLeaderDashboard
 *  Sales + Employee     → SalesEmployeeDashboard
 *
 * The old document-upload dashboard has been replaced by this hierarchy.
 */

import { useAuth } from "../../context/AuthContext";
import { getUserRole } from "../../utils/hierarchy";
import SalesManagerDashboard     from "./SalesManagerDashboard";
import SalesTeamLeaderDashboard  from "./SalesTeamLeaderDashboard";
import SalesEmployeeDashboard    from "./SalesEmployeeDashboard";

export default function SalesDashboard() {
  const { user } = useAuth();
  const role = getUserRole(user);

  if (role === "Manager")     return <SalesManagerDashboard />;
  if (role === "Team Leader") return <SalesTeamLeaderDashboard />;
  return <SalesEmployeeDashboard />;
}