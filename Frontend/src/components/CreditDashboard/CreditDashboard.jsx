import { useAuth } from "../../context/AuthContext";
import { getUserRole } from "../../utils/hierarchy";
import CreditManagerDashboard from "./CreditManagerDashboard";
import CreditTeamLeaderDashboard from "./CreditTeamLeaderDashboard";
import CreditEmployeeDashboard from "./CreditEmployeeDashboard";

export default function CreditDashboard() {
  const { user } = useAuth();
  const role = getUserRole(user);

  if (role === "Manager" || role === "Admin") {
    return <CreditManagerDashboard />;
  }
  
  if (role === "Team Leader") {
    return <CreditTeamLeaderDashboard />;
  }

  return <CreditEmployeeDashboard />;
}
