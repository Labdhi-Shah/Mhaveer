import EmployeeDashboard from "../components/EmployeeDashboard";
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
    {panelHeader("Telecalling Portal", "Telecalling Manager Dashboard")}
    <EmployeeDashboard />
  </>
);

export const TelecallingEmployeeDashboard = () => (
  <>
    {panelHeader("Telecalling Portal", "Telecalling Employee Dashboard")}
    <EmployeeDashboard />
  </>
);

export default function DepartmentRoleDashboard() {
  const { user } = useAuth();
  switch (resolveDepartmentDashboard(getUserDepartment(user), getUserRole(user))) {
    case "telecalling-manager": return <TelecallingManagerDashboard />;
    case "telecalling-employee": return <TelecallingEmployeeDashboard />;
    default: return <TelecallingEmployeeDashboard />;
  }
}
