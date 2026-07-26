import { useState } from "react";
import { Bell, Building2, ChevronDown, Search, Settings, UserCircle2 } from "lucide-react";

export default function Header({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-[#08245b] backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#08245b] ring-1 ring-[#d4af37]/20">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">Loan Management Portal</p>
            <p className="text-lg font-semibold text-white">Super Admin Center</p>
          </div>
        </div>

        <div className="hidden flex-1 px-4 md:block">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search here..."
              className="w-full rounded-2xl border border-white/10 bg-[#071a2b] py-3 pl-12 pr-4 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative rounded-2xl border border-white/10 bg-[#071a2b] p-2.5 text-slate-200 transition hover:border-[#d4af37]/40 hover:text-white">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-semibold text-white">
              3
            </span>
          </button>

          <button className="rounded-2xl border border-white/10 bg-[#071a2b] p-2.5 text-slate-200 transition hover:border-[#d4af37]/40 hover:text-white">
            <Settings className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((value) => !value)}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#071a2b] px-2 py-2 text-left transition hover:border-[#d4af37]/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#08245b]">
                <UserCircle2 className="h-6 w-6" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-white">{user?.name || "Super Admin"}</p>
                <p className="text-xs text-slate-300">{user?.email || "admin@example.com"}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-300" />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 mt-3 w-60 rounded-2xl border border-white/10 bg-[#071a2b] p-3 shadow-2xl shadow-slate-950/60 backdrop-blur-xl">
                <div className="border-b border-white/10 pb-3">
                  <p className="text-sm font-semibold text-white">{user?.name || "Super Admin"}</p>
                  <p className="text-sm text-slate-300">{user?.email || "admin@example.com"}</p>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setMenuOpen(false);
                  }}
                  className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-[#071a2b] hover:text-white"
                >
                  <ChevronDown className="h-4 w-4 rotate-90" />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
