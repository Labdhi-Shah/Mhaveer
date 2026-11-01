import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react";
import {
  getStoredEodReports,
  getTodayDateKey,
  formatCount
} from "../utils/eodStorage";

export default function TeamMemberEodBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [todayReport, setTodayReport] = useState(null);

  const employeeName = user?.name || user?.fullName || "Shruti";
  const todayKey = getTodayDateKey();

  const checkTodayStatus = () => {
    const all = getStoredEodReports();
    const found = all.find(
      (r) =>
        r.employeeName?.toLowerCase() === employeeName.toLowerCase() &&
        r.date === todayKey
    );
    setTodayReport(found || null);
  };

  useEffect(() => {
    checkTodayStatus();

    const handleUpdate = () => {
      checkTodayStatus();
    };

    window.addEventListener("mhaveer-eod-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("mhaveer-eod-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [user]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-5 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-2xl shrink-0 ${todayReport ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
          <FileSpreadsheet size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-[#162335]">
              Daily EOD (End of Day) Status
            </h3>
            {todayReport ? (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={11} /> Submitted
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                <Clock size={11} /> Pending
              </span>
            )}
          </div>
          {todayReport ? (
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Today&apos;s Numbers — Received: <strong className="text-blue-700">{todayReport.received}</strong> • Appointment: <strong className="text-amber-700">{formatCount(todayReport.appointment)}</strong> • Login: <strong className="text-emerald-700">{formatCount(todayReport.login)}</strong>
            </p>
          ) : (
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Submit your daily Received, Appointment, and Login counts before end of day.
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => navigate("/eod")}
        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#162335] hover:bg-slate-800 text-white rounded-xl text-xs font-black transition self-start sm:self-auto whitespace-nowrap shadow-xs cursor-pointer"
      >
        <span>{todayReport ? "View / Edit EOD" : "Submit EOD"}</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
}

