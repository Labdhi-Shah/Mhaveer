import { useAuth } from "../context/AuthContext";
import DashboardView from "../DashboardView";
import EmployeeDashboard from "./EmployeeDashboard";
import { getUserRoleCategory } from "../utils/hierarchy";

export default function DashboardSelector() {
  const { user } = useAuth();
  if (getUserRoleCategory(user) === "Admin") {
    return <DashboardView />;
  }
  return <EmployeeDashboard />;
}
