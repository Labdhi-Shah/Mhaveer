import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  UserPlus,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  Calendar,
  Activity,
  Award
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { getLeads, getActivities, getPerformanceData, getRevenueData } from "./dummyData";
import "./SalesDepartment.css";

export default function SalesDashboard() {
  const [leads, setLeads] = useState([]);
  const [activities, setActivities] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    setLeads(getLeads());
    setActivities(getActivities());
    setPerformanceData(getPerformanceData());
    setRevenueData(getRevenueData());
  }, []);

  // Compute Stats
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.stage === "New Lead").length;
  const qualifiedLeads = leads.filter(l => l.stage === "Qualified").length;
  const wonDeals = leads.filter(l => l.stage === "Won").length;
  const lostDeals = leads.filter(l => l.stage === "Lost").length;
  
  // Format Currency
  const formatINR = (num) => {
    if (num >= 10000000) {
      return (num / 10000000).toFixed(2) + " Cr";
    } else if (num >= 100000) {
      return (num / 100000).toFixed(2) + " L";
    }
    return "₹" + num.toLocaleString();
  };

  // Sum Won Deals revenue
  const totalWonRevenue = leads
    .filter(l => l.stage === "Won")
    .reduce((sum, lead) => sum + (lead.loanAmount || 0), 0);

  // Sales Target Progress
  const targetRevenue = 50000000; // 5 Crores target
  const targetPercent = Math.min(Math.round((totalWonRevenue / targetRevenue) * 100), 100);

  // Filter meetings & followups
  const upcomingMeetings = leads
    .filter(l => l.meetingDate)
    .slice(0, 4);

  const latestFollowups = leads
    .filter(l => l.followUpDate)
    .slice(0, 4);

  return (
    <div className="sales-stack">
      {/* Title Banner */}
      <div className="sales-title-banner">
        <p>Sales Department Dashboard</p>
        <h1>Welcome Back, Sales Representative</h1>
      </div>

      {/* Stats Cards */}
      <div className="sales-grid-stats">
        <div className="sales-stat-card">
          <div className="sales-stat-icon" style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
            <Users size={18} />
          </div>
          <div>
            <p className="sales-stat-label">Total Leads</p>
            <h3 className="sales-stat-value">{totalLeads}</h3>
          </div>
        </div>

        <div className="sales-stat-card">
          <div className="sales-stat-icon" style={{ backgroundColor: "#fef3c7", color: "#d97706" }}>
            <UserPlus size={18} />
          </div>
          <div>
            <p className="sales-stat-label">New Leads</p>
            <h3 className="sales-stat-value">{newLeads}</h3>
          </div>
        </div>

        <div className="sales-stat-card">
          <div className="sales-stat-icon" style={{ backgroundColor: "#f5f3ff", color: "#7c3aed" }}>
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="sales-stat-label">Qualified</p>
            <h3 className="sales-stat-value">{qualifiedLeads}</h3>
          </div>
        </div>

        <div className="sales-stat-card">
          <div className="sales-stat-icon" style={{ backgroundColor: "#ecfdf5", color: "#059669" }}>
            <CheckCircle size={18} />
          </div>
          <div>
            <p className="sales-stat-label">Won Deals</p>
            <h3 className="sales-stat-value">{wonDeals}</h3>
          </div>
        </div>

        <div className="sales-stat-card">
          <div className="sales-stat-icon" style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>
            <XCircle size={18} />
          </div>
          <div>
            <p className="sales-stat-label">Lost Deals</p>
            <h3 className="sales-stat-value">{lostDeals}</h3>
          </div>
        </div>

        <div className="sales-stat-card">
          <div className="sales-stat-icon" style={{ backgroundColor: "#fef3c7", color: "#d4af37" }}>
            <DollarSign size={18} />
          </div>
          <div>
            <p className="sales-stat-label">Monthly Rev.</p>
            <h3 className="sales-stat-value" style={{ fontSize: "1.1rem" }}>{formatINR(totalWonRevenue)}</h3>
          </div>
        </div>
      </div>

      {/* Target Progress Bar */}
      <div className="sales-target-card">
        <div className="sales-target-header">
          <h4 className="sales-target-title">Monthly Sales Target Progress</h4>
          <span className="sales-target-percentage">{targetPercent}% Achieved</span>
        </div>
        <div className="sales-progress-track">
          <div className="sales-progress-fill" style={{ width: `${targetPercent}%` }}></div>
        </div>
        <div className="sales-target-footer">
          <span>Won: {formatINR(totalWonRevenue)}</span>
          <span>Target: {formatINR(targetRevenue)}</span>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="sales-dash-columns">
        {/* Main Charts Col */}
        <div className="sales-dash-main-col">
          {/* Revenue Chart */}
          <div className="sales-chart-card">
            <h4 className="sales-chart-title">Revenue Progress Trend (INR Crores)</h4>
            <div className="sales-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v}Cr`} />
                  <Tooltip formatter={(v) => [`₹${v} Cr`, "Revenue"]} />
                  <Area type="monotone" dataKey="Revenue" stroke="#d4af37" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="sales-chart-card">
            <h4 className="sales-chart-title">Weekly Sales Performance (Leads vs Conversions)</h4>
            <div className="sales-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="Leads" fill="#0a2540" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Conversions" fill="#d4af37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Side Column Widgets */}
        <div className="sales-dash-side-col">
          {/* Upcoming Meetings */}
          <div className="sales-widget-card">
            <div className="sales-widget-header">
              <h4 className="sales-widget-title">
                <Calendar size={16} className="text-[#d4af37]" /> Upcoming Client Consultations
              </h4>
            </div>
            <div className="sales-widget-list">
              {upcomingMeetings.length === 0 ? (
                <div style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center", padding: "10px" }}>
                  No upcoming meetings scheduled.
                </div>
              ) : (
                upcomingMeetings.map((meeting) => (
                  <div className="sales-row-item" key={meeting._id}>
                    <div className="sales-row-info">
                      <p className="sales-row-title">{meeting.companyName}</p>
                      <p className="sales-row-subtitle">
                        Contact: {meeting.contactPerson} | {meeting.loanType}
                      </p>
                      <p className="sales-row-subtitle" style={{ color: "#d4af37", fontWeight: 700 }}>
                        {meeting.meetingDate} at {meeting.meetingTime || "N/A"}
                      </p>
                    </div>
                    <span className="sales-row-badge-pill upcoming">Consultation</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Latest Followups */}
          <div className="sales-widget-card">
            <div className="sales-widget-header">
              <h4 className="sales-widget-title">
                <Clock size={16} className="text-[#d4af37]" /> Latest Follow-ups Due
              </h4>
            </div>
            <div className="sales-widget-list">
              {latestFollowups.length === 0 ? (
                <div style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center", padding: "10px" }}>
                  No follow-ups due.
                </div>
              ) : (
                latestFollowups.map((follow) => (
                  <div className="sales-row-item" key={follow._id}>
                    <div className="sales-row-info">
                      <p className="sales-row-title">{follow.companyName}</p>
                      <p className="sales-row-subtitle">Ph: {follow.phone}</p>
                      <p className="sales-row-subtitle" style={{ fontStyle: "italic" }}>
                        Call back: {follow.followUpDate} at {follow.followUpTime || "N/A"}
                      </p>
                    </div>
                    <span
                      className="sales-row-badge-pill"
                      style={{
                        backgroundColor: follow.interested === "Yes" ? "#ecfdf5" : "#fffbeb",
                        color: follow.interested === "Yes" ? "#065f46" : "#b45309"
                      }}
                    >
                      {follow.interested || "Pending"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="sales-widget-card">
            <div className="sales-widget-header">
              <h4 className="sales-widget-title">
                <Activity size={16} className="text-[#d4af37]" /> Sales Activities Log
              </h4>
            </div>
            <div className="sales-widget-list">
              {activities.map((act) => (
                <div className="sales-activity-item" key={act.id}>
                  <div className="sales-activity-icon-wrap">
                    <Activity size={12} />
                  </div>
                  <div className="sales-activity-content">
                    <p className="sales-activity-desc">{act.text}</p>
                    <span className="sales-activity-time">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
