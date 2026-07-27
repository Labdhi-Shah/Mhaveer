import { useAuth } from "../context/AuthContext";
import DashboardView from "../DashboardView";
import EmployeeDashboard from "./EmployeeDashboard";

export default function DashboardSelector() {
  const { user } = useAuth();
  if (user?.role === "SuperAdmin") {
    return <DashboardView />;
  }
  return <EmployeeDashboard />;
}
