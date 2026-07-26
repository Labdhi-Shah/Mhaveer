import React from "react";
import { Bell, Settings } from "lucide-react";
// જો તમે લોગો ઈમેજને src/assets/logo.png તરીકે રાખેલી હોય:
// import logoImg from "./assets/logo.png"; 

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#0a2540] text-white border-b-2 border-[#d4af37] z-50 flex items-center justify-between px-6 shadow-md">
      {/* BRAND LOGO SECTION */}
      <div className="flex items-center gap-3">
        {/* Logo Image */}
        <div className="w-10 h-10 bg-white p-1 rounded-xl flex items-center justify-center shadow-md overflow-hidden">
          <img 
            src="/src/assets/logo.svg" 
            alt="MHAVEER FINCAP Logo" 
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback if image path is different
              e.target.style.display = 'none';
            }}
          />
        </div>
        <div>
          <span className="font-black text-lg tracking-wide text-white">
            MHAVEER <span className="text-[#d4af37]">FINCAP</span>
          </span>
         
        </div>
      </div>

      {/* RIGHT SIDE CONTROLS */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-300 hover:text-[#d4af37] rounded-lg transition relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#d4af37] rounded-full" />
        </button>
        <button className="p-2 text-slate-300 hover:text-[#d4af37] rounded-lg transition">
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