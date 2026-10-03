/**
 * DepartmentRoleDashboard.jsx
 *
 * Routes authenticated users to their department+role-specific dashboard.
 * Architecture: Department → Panel → Role → Screen
 *
 * Sales:
 *   Manager     → SalesManagerDashboard
 *   Team Leader → SalesTeamLeaderDashboard
 *   Employee    → SalesEmployeeDashboard
 *   (all routed via SalesDashboard dispatcher)
 *
 * Telecalling:
 *   Manager / Team Leader / Employee → EmployeeDashboard (with panel header)
 *
 * Leads:
 *   Manager / Team Leader / Employee → EmployeeDashboard (with panel header)
 */

import EmployeeDashboard from "../components/EmployeeDashboard";
import SalesDashboard from "../components/SalesDashboard/SalesDashboard";
// import SalesManagerDashboard from "../components/SalesDashboard/SalesManagerDashboard";
import { useAuth } from "../context/AuthContext";
import { resolveDepartmentDashboard, getUserDepartment, getUserRole } from "../utils/hierarchy";
import CreditDashboard from "./CreditDashboard/CreditDashboard";

const panelHeader = (label, title) => (
  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-[#0a2540] mb-6">
    <p className="text-xs font-extrabold uppercase tracking-widest text-[#d4af37]">{label}</p>
    <h1 className="text-xl sm:text-2xl font-black text-[#0a2540] mt-1">{title}</h1>
  </div>
);

export const TelecallingManagerDashboard = () => (
  <>
    {panelHeader("Telecalling Portal", "Telecalling Manager Dashboard")}
    <EmployeeDashboard />
  </>
);

export const TelecallingTeamLeaderDashboard = () => (
  <>
    {panelHeader("Telecalling Portal", "Telecalling Team Leader Dashboard")}
    <EmployeeDashboard />
  </>
);

export const TelecallingEmployeeDashboard = () => (
  <>
    {panelHeader("Telecalling Portal", "Telecalling Employee Dashboard")}
    <EmployeeDashboard />
  </>
);

// Sales dashboards — all routed through the SalesDashboard role-dispatcher
// which internally renders SalesManagerDashboard, SalesTeamLeaderDashboard,
// or SalesEmployeeDashboard based on the authenticated user's role.
export const SalesManagerDashboardWrapper = () => <SalesDashboard />;
export const SalesTeamLeaderDashboardWrapper = () => <SalesDashboard />;
export const SalesEmployeeDashboardWrapper = () => <SalesDashboard />;

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

export const CreditManagerDashboardWrapper = () => <CreditDashboard />;
export const CreditTeamLeaderDashboardWrapper = () => <CreditDashboard />;
export const CreditEmployeeDashboardWrapper = () => <CreditDashboard />;

const GenericDepartmentDashboard = ({ department, role }) => (
  <>
    {panelHeader(`${department} Panel`, `${department} ${role} Dashboard`)}
    <EmployeeDashboard />
  </>
);

export default function DepartmentRoleDashboard() {
  const { user } = useAuth();
  switch (resolveDepartmentDashboard(getUserDepartment(user), getUserRole(user))) {
    case "sales-manager": return <SalesManagerDashboardWrapper />;
    case "sales-team-leader": return <SalesTeamLeaderDashboardWrapper />;
    case "sales-employee": return <SalesEmployeeDashboardWrapper />;
    case "telecalling-manager": return <TelecallingManagerDashboard />;
    case "telecalling-team-leader": return <TelecallingTeamLeaderDashboard />;
    case "telecalling-employee": return <TelecallingEmployeeDashboard />;
    case "leads-manager": return <LeadsManagerDashboard />;
    case "leads-team-leader": return <LeadsTeamLeaderDashboard />;
    case "leads-employee": return <LeadsEmployeeDashboard />;
    case "credit-manager": return <CreditManagerDashboardWrapper />;
    case "credit-team-leader": return <CreditTeamLeaderDashboardWrapper />;
    case "credit-employee": return <CreditEmployeeDashboardWrapper />;
    case "department-role": return <GenericDepartmentDashboard department={user.department} role={user.role} />;
    default: return null;
  }
}
