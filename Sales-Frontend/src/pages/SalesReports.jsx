import React, { useState, useEffect } from "react";
import {
  FileText,
  DollarSign,
  TrendingUp,
  Download,
  CheckCircle,
  RefreshCw,
  PieChart as PieIcon
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { getLeads, getRevenueData } from "../utils/dummyData";
import "../components/SalesDepartment.css";

export default function SalesReports() {
  const [leads, setLeads] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      setLeads(getLeads());
      setRevenueData(getRevenueData());
      setLoading(false);
    }, 450);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculations
  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.stage === "Won");
  const lostLeads = leads.filter((l) => l.stage === "Lost");
  const wonCount = wonLeads.length;
  const lostCount = lostLeads.length;
  
  // Win rate based on resolved deals
  const winRate =
    wonCount + lostCount > 0
      ? Math.round((wonCount / (wonCount + lostCount)) * 100)
      : 0;

  // Disbursed amount
  const totalDisbursed = wonLeads.reduce((sum, l) => sum + (l.loanAmount || 0), 0);
  const averageDealSize = wonCount > 0 ? Math.round(totalDisbursed / wonCount) : 0;

  // Pie Chart Data for Stage Distribution
  const stageCounts = {};
  leads.forEach((l) => {
    stageCounts[l.stage] = (stageCounts[l.stage] || 0) + 1;
  });

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#a855f7", "#10b981", "#ef4444"];
  const pieData = Object.keys(stageCounts).map((key) => ({
    name: key,
    value: stageCounts[key]
  }));

  // Bar Chart Data for Loan Type volume
  const typeCounts = {};
  leads.forEach((l) => {
    typeCounts[l.loanType] = (typeCounts[l.loanType] || 0) + 1;
  });
  const barData = Object.keys(typeCounts).map((key) => ({
    name: key,
    Volume: typeCounts[key]
  }));

  const formatINR = (num) => {
    if (num >= 10000000) {
      return "₹" + (num / 10000000).toFixed(2) + " Cr";
    } else if (num >= 100000) {
      return "₹" + (num / 100000).toFixed(2) + " L";
    }
    return "₹" + num.toLocaleString();
  };

  const handleExport = () => {
    showToast("Generating spreadsheet... Report successfully exported to Excel!");
  };

  return (
    <div className="sales-stack">
      {/* Toast */}
      {toast && (
        <div className="sales-toast-container">
          <div className="sales-toast success">
            <CheckCircle size={18} />
            <span className="sales-toast-text">{toast}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sales-title-banner blue-border">
        <p>REPORTING ENGINE</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <h1>Sales Performance Reports</h1>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleExport} className="sales-btn gold">
              <Download size={15} /> Export Report
            </button>
            <button onClick={loadData} className="sales-btn secondary">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="sales-grid-stats">
        <div className="sales-stat-card" style={{ gridColumn: "span 2" }}>
          <div className="sales-stat-icon" style={{ backgroundColor: "#ecfdf5", color: "#10b981" }}>
            <DollarSign size={18} />
          </div>
          <div>
            <p className="sales-stat-label">Total Capital Disbursed</p>
            <h3 className="sales-stat-value" style={{ fontSize: "1.4rem" }}>{formatINR(totalDisbursed)}</h3>
          </div>
        </div>

        <div className="sales-stat-card" style={{ gridColumn: "span 2" }}>
          <div className="sales-stat-icon" style={{ backgroundColor: "#eff6ff", color: "#3b82f6" }}>
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="sales-stat-label">Deal Close Win Rate</p>
            <h3 className="sales-stat-value" style={{ fontSize: "1.4rem" }}>{winRate}%</h3>
          </div>
        </div>

        <div className="sales-stat-card" style={{ gridColumn: "span 2" }}>
          <div className="sales-stat-icon" style={{ backgroundColor: "#fdf2f8", color: "#ec4899" }}>
            <FileText size={18} />
          </div>
          <div>
            <p className="sales-stat-label">Average Disbursed Deal Size</p>
            <h3 className="sales-stat-value" style={{ fontSize: "1.4rem" }}>{formatINR(averageDealSize)}</h3>
          </div>
        </div>
      </div>

      {/* Charts Panels */}
      {loading ? (
        <div className="sales-loading-state">
          <div className="sales-spinner"></div>
          <span className="sales-loading-text">Analyzing database...</span>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
          {/* Revenue Chart */}
          <div className="sales-chart-card">
            <h4 className="sales-chart-title">Historical Monthly Disbursement Trend (INR Crores)</h4>
            <div className="sales-chart-container" style={{ height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="disburseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0a2540" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0a2540" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v}Cr`} />
                  <Tooltip formatter={(v) => [`₹${v} Cr`, "Disbursed Amount"]} />
                  <Area type="monotone" dataKey="Revenue" stroke="#0a2540" strokeWidth={3} fillOpacity={1} fill="url(#disburseGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }} className="md:grid-cols-2">
            {/* Stage distribution Pie chart */}
            <div className="sales-chart-card">
              <h4 className="sales-chart-title">Lead Stage Distribution (Funnel Breakdown)</h4>
              <div className="sales-chart-container" style={{ height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Loan type volume Bar Chart */}
            <div className="sales-chart-card">
              <h4 className="sales-chart-title">Loan Type Distribution (Lead Volume)</h4>
              <div className="sales-chart-container" style={{ height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="Volume" fill="#d4af37" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
