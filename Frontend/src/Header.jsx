import { Bell, Settings, Menu } from "lucide-react";
import logoSvg from "./assets/logo.svg";

export default function Header({ onToggleSidebar }) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#0a2540] text-white border-b-2 border-[#d4af37] z-50 flex items-center justify-between px-4 md:px-6 shadow-md">
      {/* BRAND LOGO SECTION */}
      <div className="flex items-center gap-3">
        {/* Toggle Button for mobile */}
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-300 hover:text-white rounded-lg transition md:hidden cursor-pointer"
          title="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Logo Image */}
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white p-1 rounded-xl flex items-center justify-center shadow-md overflow-hidden shrink-0">
          <img 
            src={logoSvg} 
            alt="MHAVEER FINCAP Logo" 
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback if image path is different
              e.target.style.display = 'none';
            }}
          />
        </div>
        <div>
          <span className="font-black text-sm sm:text-lg tracking-wide text-white whitespace-nowrap">
            MHAVEER <span className="text-[#d4af37]">FINCAP</span>
          </span>
        </div>
      </div>

      {/* RIGHT SIDE CONTROLS */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button className="p-2 text-slate-300 hover:text-[#d4af37] rounded-lg transition relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#d4af37] rounded-full" />
        </button>
        <button className="p-2 text-slate-300 hover:text-[#d4af37] rounded-lg transition hidden sm:block">
          <Settings size={18} />
        </button>

        <div className="h-6 w-px bg-slate-700" />

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#d4af37] text-[#0a2540] flex items-center justify-center font-extrabold text-xs shadow-md">
            SA
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-white leading-none">Super Admin</p>
            <p className="text-[10px] text-slate-300 mt-0.5">admin@mhaveerfincap.com</p>
          </div>
        </div>
      </div>
    </header>
  );
}