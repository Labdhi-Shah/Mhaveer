import React, { useState } from "react";
import { Settings, Save, CheckCircle } from "lucide-react";
import "../components/SalesDepartment.css";

export default function SalesSettings() {
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    meetingReminders: true,
    newLeadAssigned: true,
    weeklyReportSummary: false
  });
  
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCheckboxChange = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    showToast("System settings successfully saved in this local session!");
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
        <p>SYSTEM CONFIGURATION</p>
        <h1>Portal Preferences & Settings</h1>
      </div>

      <form onSubmit={handleSave} className="sales-widget-card" style={{ gap: "1.5rem" }}>
        <h4 className="sales-chart-title">
          <Settings size={16} style={{ verticalAlign: "middle", marginRight: "6px" }} /> General Preferences
        </h4>

        {/* Theme Settings */}
        <div className="sales-form-group">
          <label className="sales-form-label">Active Theme Mode</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="sales-select-filter"
            style={{ maxWidth: "300px", padding: "0.625rem 0.875rem" }}
          >
            <option value="light">Harmonious Light Mode (Default)</option>
            <option value="dark">Vibrant Dark Mode</option>
            <option value="system">System Synced Mode</option>
          </select>
        </div>

        {/* Language Settings */}
        <div className="sales-form-group">
          <label className="sales-form-label">System Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="sales-select-filter"
            style={{ maxWidth: "300px", padding: "0.625rem 0.875rem" }}
          >
            <option value="en">English (US/UK)</option>
            <option value="hi">Hindi (हिन्दी)</option>
            <option value="gu">Gujarati (ગુજરાતી)</option>
          </select>
        </div>

        <div style={{ height: "1px", backgroundColor: "#f1f5f9" }}></div>

        {/* Notification checklist */}
        <div className="sales-form-group" style={{ gap: "0.75rem" }}>
          <label className="sales-form-label" style={{ marginBottom: "4px" }}>
            Sales Notifications & Trigger Alerts
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "#334155",
              cursor: "pointer"
            }}
          >
            <input
              type="checkbox"
              checked={notifications.emailAlerts}
              onChange={() => handleCheckboxChange("emailAlerts")}
              className="sales-login-checkbox"
            />
            Email Alerts for newly assigned deal activities
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "#334155",
              cursor: "pointer"
            }}
          >
            <input
              type="checkbox"
              checked={notifications.meetingReminders}
              onChange={() => handleCheckboxChange("meetingReminders")}
              className="sales-login-checkbox"
            />
            Pre-meeting alarm reminder notices (15m prior)
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "#334155",
              cursor: "pointer"
            }}
          >
            <input
              type="checkbox"
              checked={notifications.newLeadAssigned}
              onChange={() => handleCheckboxChange("newLeadAssigned")}
              className="sales-login-checkbox"
            />
            Desktop push triggers for stage transitions
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "#334155",
              cursor: "pointer"
            }}
          >
            <input
              type="checkbox"
              checked={notifications.weeklyReportSummary}
              onChange={() => handleCheckboxChange("weeklyReportSummary")}
              className="sales-login-checkbox"
            />
            Receive automated weekly performance Excel email copies
          </label>
        </div>

        {/* Action Panel */}
        <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
          <button type="submit" className="sales-btn primary">
            <Save size={15} /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
