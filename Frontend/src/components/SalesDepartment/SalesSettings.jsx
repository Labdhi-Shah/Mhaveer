import React, { useState } from "react";
import { Settings, Shield, Bell, CheckCircle } from "lucide-react";
import "./SalesDepartment.css";

export default function SalesSettings() {
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("en");
  
  // Notification checklist states
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    weeklyDigest: true,
    leadAssigned: true
  });

  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleNotifyToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    showToast("System preferences saved successfully!");
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
        <p>PORTAL CONFIGURATIONS</p>
        <h1>System Preferences & Settings</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }} className="md:grid-cols-2">
        {/* Left Side: General portal configs */}
        <div className="sales-widget-card">
          <h4 className="sales-chart-title">
            <Settings size={16} style={{ verticalAlign: "middle", marginRight: "6px" }} /> General Interface Settings
          </h4>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "10px" }}>
            {/* Theme Selector */}
            <div className="sales-form-group">
              <label className="sales-form-label">Color Theme Preference (UI Only)</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "4px" }}>
                {["light", "dark", "system"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className="sales-btn"
                    style={{
                      backgroundColor: theme === t ? "var(--sales-primary-blue)" : "#fff",
                      color: theme === t ? "#fff" : "#475569",
                      border: "1px solid var(--sales-border-color)",
                      textTransform: "capitalize",
                      fontSize: "11px",
                      padding: "8px 0"
                    }}
                  >
                    {t} Mode
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selector */}
            <div className="sales-form-group" style={{ marginTop: "8px" }}>
              <label className="sales-form-label">System Portal Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="sales-select-filter"
                style={{ padding: "0.625rem 0.875rem", width: "100%", marginTop: "4px" }}
              >
                <option value="en">English (US / UK)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="gu">Gujarati (ગુજરાતી)</option>
                <option value="es">Spanish (Español)</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
              <button type="submit" className="sales-btn primary">
                Save Preferences
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Checklists for notifications */}
        <div className="sales-widget-card">
          <h4 className="sales-chart-title">
            <Bell size={16} style={{ verticalAlign: "middle", marginRight: "6px" }} /> Communication & Notification Settings
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "10px" }}>
            <label
              className="sales-login-checkbox-label"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontWeight: 800, color: "#334155", fontSize: "12px" }}>Email Notification Alerts</span>
                <span style={{ color: "#94a3b8", fontSize: "10px", fontWeight: "normal" }}>Receive immediate lead allocations via email.</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.emailAlerts}
                onChange={() => handleNotifyToggle("emailAlerts")}
                className="sales-login-checkbox"
                style={{ width: "16px", height: "16px" }}
              />
            </label>

            <label
              className="sales-login-checkbox-label"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontWeight: 800, color: "#334155", fontSize: "12px" }}>SMS Text Alerts</span>
                <span style={{ color: "#94a3b8", fontSize: "10px", fontWeight: "normal" }}>Receive SMS messages for critical meeting schedules.</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.smsAlerts}
                onChange={() => handleNotifyToggle("smsAlerts")}
                className="sales-login-checkbox"
                style={{ width: "16px", height: "16px" }}
              />
            </label>

            <label
              className="sales-login-checkbox-label"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontWeight: 800, color: "#334155", fontSize: "12px" }}>Weekly Performance Digest</span>
                <span style={{ color: "#94a3b8", fontSize: "10px", fontWeight: "normal" }}>Get weekly sales summary charts and conversion reviews.</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.weeklyDigest}
                onChange={() => handleNotifyToggle("weeklyDigest")}
                className="sales-login-checkbox"
                style={{ width: "16px", height: "16px" }}
              />
            </label>

            <label
              className="sales-login-checkbox-label"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontWeight: 800, color: "#334155", fontSize: "12px" }}>New Lead Notification</span>
                <span style={{ color: "#94a3b8", fontSize: "10px", fontWeight: "normal" }}>Notify immediately when a new lead is assigned to you.</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.leadAssigned}
                onChange={() => handleNotifyToggle("leadAssigned")}
                className="sales-login-checkbox"
                style={{ width: "16px", height: "16px" }}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
