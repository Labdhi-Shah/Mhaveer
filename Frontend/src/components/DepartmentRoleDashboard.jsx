import EmployeeDashboard from "../components/EmployeeDashboard";
import SalesDashboard from "../components/SalesDashboard/SalesDashboard";
import { useAuth } from "../context/AuthContext";
import { resolveDepartmentDashboard, getUserDepartment, getUserRole } from "../utils/hierarchy";

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
    <SalesDashboard />
  </>
);

export const SalesTeamLeaderDashboard = () => (
  <>
    <SalesDashboard />
  </>
);

export const SalesEmployeeDashboard = () => (
  <>
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

const GenericDepartmentDashboard = ({ department, role }) => (
  <>
    {panelHeader(`${department} Panel`, `${department} ${role} Dashboard`)}
    <EmployeeDashboard />
  </>
);

export default function DepartmentRoleDashboard() {
  const { user } = useAuth();
  switch (resolveDepartmentDashboard(getUserDepartment(user), getUserRole(user))) {
    case "sales-manager": return <SalesManagerDashboard />;
    case "sales-team-leader": return <SalesTeamLeaderDashboard />;
    case "sales-employee": return <SalesEmployeeDashboard />;
    case "telecalling-manager": return <TelecallingManagerDashboard />;
    case "telecalling-team-leader": return <TelecallingTeamLeaderDashboard />;
    case "telecalling-employee": return <TelecallingEmployeeDashboard />;
    case "leads-manager": return <LeadsManagerDashboard />;
    case "leads-team-leader": return <LeadsTeamLeaderDashboard />;
    case "leads-employee": return <LeadsEmployeeDashboard />;
    case "department-role": return <GenericDepartmentDashboard department={user.department} role={user.role} />;
    default: return null;
  }
}
