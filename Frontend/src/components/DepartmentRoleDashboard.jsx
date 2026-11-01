import EmployeeDashboard from "../components/EmployeeDashboard";
import ManagerEodSection from "../components/ManagerEodSection";
import TeamMemberEodBanner from "../components/TeamMemberEodBanner";
import { useAuth } from "../context/AuthContext";
import { resolveDepartmentDashboard, getUserDepartment, getUserRole } from "../utils/hierarchy";

const panelHeader = (label, title) => (
  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-[#162335] mb-6">
    <p className="text-xs font-extrabold uppercase tracking-widest text-[#9ca3af]">{label}</p>
    <h1 className="text-xl sm:text-2xl font-black text-[#162335] mt-1">{title}</h1>
  </div>
);

export const TelecallingManagerDashboard = () => (
  <>
    {panelHeader("Telecalling Portal", "Telecalling Manager Dashboard")}
    <ManagerEodSection />
    <EmployeeDashboard />
  </>
);

export const TelecallingEmployeeDashboard = () => (
  <>
    {panelHeader("Telecalling Portal", "Telecalling Employee Dashboard")}
    <TeamMemberEodBanner />
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
