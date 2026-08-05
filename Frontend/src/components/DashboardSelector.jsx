import { useAuth } from "../context/AuthContext";
import DashboardView from "../DashboardView";
import EmployeeDashboard from "./EmployeeDashboard";
import SalesDashboard from "./SalesDashboard/SalesDashboard";
import { getUserRoleCategory } from "../utils/hierarchy";

export default function DashboardSelector() {
  const { user } = useAuth();
  if (getUserRoleCategory(user) === "Admin") {
    return <DashboardView />;
  }
  if (user?.role === "Sales Department") {
    return <SalesDashboard />;
  }
  return <EmployeeDashboard />;
}
