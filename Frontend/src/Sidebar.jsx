import { LayoutDashboard, ShieldCheck, UserPlus, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employees/list", label: "Employee List", icon: Users },
  { to: "/employees/add", label: "Add Employee", icon: UserPlus },
];

export default function Sidebar({ currentPath }) {
  return (
    <aside className="hidden w-72 flex-col border-r border-white/10 bg-[#07132b] px-6 py-10 lg:flex">
      <div className="rounded-[28px] bg-[#0b2e5d] p-5 text-white shadow-xl ring-1 ring-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-[#08245b] text-lg font-black">
            M
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">MHAVEER</p>
            <p className="text-xs uppercase tracking-[0.28em] text-[#d4af37]">FINCAP</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-300">Finance today, secure tomorrow.</p>
      </div>

      <nav className="mt-8 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.to;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive: linkActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    linkActive || isActive
                      ? "bg-[#0b2746] text-white ring-1 ring-[#d4af37]/20"
                      : "text-slate-300 hover:bg-[#071a2b] hover:text-white"
                  }`
                }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[24px] border border-white/10 bg-[#071a2b] p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d4af37] text-[#07132b]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">Secure Your Financial Future</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-300">We are here to help you achieve your goals.</p>
        <button className="mt-4 w-full rounded-2xl bg-[#d4af37] px-3 py-3 text-sm font-semibold text-[#07132b] transition hover:bg-[#bea34d]">
          Get Started
        </button>
      </div>
    </aside>
  );
}
