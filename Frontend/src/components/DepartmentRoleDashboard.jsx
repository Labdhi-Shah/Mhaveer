import EmployeeDashboard from "../components/EmployeeDashboard";
import SalesDashboard from "../components/SalesDashboard/SalesDashboard";
import { useAuth } from "../context/AuthContext";
import { getUserDepartment, getUserRole } from "../utils/hierarchy";

const panelHeader = (label, title) => (
  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-[#0a2540] mb-6">
    <p className="text-xs font-extrabold uppercase tracking-widest text-[#d4af37]">{label}</p>
    <h1 className="text-xl sm:text-2xl font-black text-[#0a2540] mt-1">{title}</h1>
  </div>
);

export const TelecallingManagerDashboard = () => (
  <>
    {panelHeader("Telecalling Panel", "Telecalling Manager Dashboard")}
    <EmployeeDashboard />
  </>
);

export const TelecallingTeamLeaderDashboard = () => (
  <>
    {panelHeader("Telecalling Panel", "Telecalling Team Leader Dashboard")}
    <EmployeeDashboard />
  </>
);

export const TelecallingEmployeeDashboard = () => (
  <>
    {panelHeader("Telecalling Panel", "Telecalling Employee Dashboard")}
    <EmployeeDashboard />
  </>
);

export const SalesManagerDashboard = () => (
  <>
    {panelHeader("Sales Panel", "Sales Manager Dashboard")}
    <SalesDashboard />
  </>
);

export const SalesTeamLeaderDashboard = () => (
  <>
    {panelHeader("Sales Panel", "Sales Team Leader Dashboard")}
    <SalesDashboard />
  </>
);

export const SalesEmployeeDashboard = () => (
  <>
    {panelHeader("Sales Panel", "Sales Employee Dashboard")}
    <SalesDashboard />
  </>
);

export const LeadsManagerDashboard = () => (
  <>
    {panelHeader("Leads Panel", "Leads Manager Dashboard")}
    <EmployeeDashboard />
  </>
);

export const LeadsTeamLeaderDashboard = () => (
  <>
    {panelHeader("Leads Panel", "Leads Team Leader Dashboard")}
    <EmployeeDashboard />
  </>
);

export const LeadsEmployeeDashboard = () => (
  <>
    {panelHeader("Leads Panel", "Leads Employee Dashboard")}
    <EmployeeDashboard />
  </>
);

export default function DepartmentRoleDashboard() {
  const { user } = useAuth();
  const department = getUserDepartment(user);
  const role = getUserRole(user);

  if (department === "Sales") {
    if (role === "Manager") return <SalesManagerDashboard />;
    if (role === "Team Leader") return <SalesTeamLeaderDashboard />;
    return <SalesEmployeeDashboard />;
  }

  if (department === "Telecalling") {
    if (role === "Manager") return <TelecallingManagerDashboard />;
    if (role === "Team Leader") return <TelecallingTeamLeaderDashboard />;
    return <TelecallingEmployeeDashboard />;
  }

  if (department === "Leads") {
    if (role === "Manager") return <LeadsManagerDashboard />;
    if (role === "Team Leader") return <LeadsTeamLeaderDashboard />;
    return <LeadsEmployeeDashboard />;
  }

  if (role === "Manager") return <TelecallingManagerDashboard />;
  if (role === "Team Leader") return <TelecallingTeamLeaderDashboard />;
  return <TelecallingEmployeeDashboard />;
}
