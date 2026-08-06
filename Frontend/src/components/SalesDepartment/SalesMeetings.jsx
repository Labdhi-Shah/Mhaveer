import React, { useState, useEffect } from "react";
import {
  Calendar,
  Phone,
  Clock,
  MapPin,
  CheckCircle,
  RefreshCw,
  Search,
  Check
} from "lucide-react";
import { getLeads, saveLeads, addActivity } from "./dummyData";
import "./SalesDepartment.css";

export default function SalesMeetings() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      setLeads(getLeads());
      setLoading(false);
    }, 400);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkComplete = (leadId) => {
    const updated = leads.map(lead => {
      if (lead._id === leadId) {
        addActivity(`Completed meeting with ${lead.companyName}`, "meeting_complete");
        return {
          ...lead,
          meetingCompleted: true
        };
      }
      return lead;
    });

    saveLeads(updated);
    setLeads(updated);
    showToast("Meeting marked as completed successfully!", "success");
  };

  const handleReschedule = (leadId, date, time) => {
    if (!date) return;
    const updated = leads.map(lead => {
      if (lead._id === leadId) {
        addActivity(`Rescheduled meeting with ${lead.companyName} to ${date}`, "meeting_reschedule");
        return {
          ...lead,
          meetingDate: date,
          meetingTime: time || "12:00",
          meetingCompleted: false
        };
      }
      return lead;
    });

    saveLeads(updated);
    setLeads(updated);
    showToast("Meeting rescheduled successfully!", "success");
  };

  // Filter meetings
  const filteredLeads = leads.filter(lead => {
    if (!lead.meetingDate) return false;

    const matchSearch =
      lead.companyName.toLowerCase().includes(search.toLowerCase()) ||
      lead.contactPerson.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;

    if (activeTab === "completed") {
      return lead.meetingCompleted === true;
    } else {
      return !lead.meetingCompleted;
    }
  });

  return (
    <div className="sales-stack">
      {/* Toast */}
      {toast && (
        <div className="sales-toast-container">
          <div className={`sales-toast ${toast.type}`}>
            <CheckCircle size={18} />
            <span className="sales-toast-text">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sales-title-banner blue-border" style={{ borderLeftColor: "#a855f7" }}>
        <p>MEETING LOGS</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <h1>Scheduled Client Consultations</h1>
          <button onClick={loadData} className="sales-btn secondary">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sales-tabs">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`sales-tab-btn ${activeTab === "upcoming" ? "active" : ""}`}
        >
          Upcoming Meetings
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`sales-tab-btn ${activeTab === "completed" ? "active" : ""}`}
        >
          Completed Consultations
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="sales-filter-card">
        <div className="sales-search-box" style={{ maxWidth: "100%" }}>
          <Search className="sales-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search meetings by client name, rep..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sales-search-box-input"
          />
        </div>
      </div>

      {/* Meetings Grid / List */}
      {loading ? (
        <div className="sales-loading-state">
          <div className="sales-spinner"></div>
          <span className="sales-loading-text">Syncing meeting directory...</span>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="sales-empty-state">
          <h4 className="sales-empty-state-title">No Meetings Found</h4>
          <p className="sales-empty-state-desc">
            No consultations are scheduled under this category. Keep filling the pipeline to schedule more client face-to-faces!
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
          {filteredLeads.map((lead) => (
            <div
              key={lead._id}
              className="sales-widget-card"
              style={{
                padding: "1.25rem",
                borderLeft: lead.meetingCompleted ? "6px solid #16a34a" : "6px solid #a855f7"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "flex-start", gap: "10px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span className="sales-table-lead-id">{lead.leadId}</span>
                    <span
                      className="sales-row-badge-pill"
                      style={{
                        backgroundColor: lead.meetingCompleted ? "#ecfdf5" : "#f3e8ff",
                        color: lead.meetingCompleted ? "#065f46" : "#6b21a8"
                      }}
                    >
                      {lead.meetingCompleted ? "Completed" : "Scheduled"}
                    </span>
                  </div>
                  <h3 className="sales-table-bold" style={{ margin: "6px 0 2px 0", fontSize: "14px" }}>
                    {lead.companyName}
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                    Rep: {lead.contactPerson} | Phone: {lead.phone}
                  </p>
                </div>

                {/* Date/Time info */}
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px"
                  }}
                >
                  <p style={{ margin: 0, fontSize: "9px", textTransform: "uppercase", color: "#94a3b8", fontWeight: 800 }}>
                    Consultation Time
                  </p>
                  <p style={{ margin: "2px 0 0 0", color: "#0a2540", fontWeight: 900, display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={12} className="text-[#a855f7]" /> {lead.meetingDate} at {lead.meetingTime || "12:00"}
                  </p>
                </div>
              </div>

              {lead.address && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "#475569",
                    backgroundColor: "#f8fafc",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    border: "1px dashed #cbd5e1"
                  }}
                >
                  <MapPin size={12} className="text-slate-400" /> Location: {lead.address}
                </div>
              )}

              {/* Actions row */}
              {!lead.meetingCompleted && (
                <div
                  style={{
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>Reschedule:</span>
                    <input
                      type="date"
                      defaultValue={lead.meetingDate}
                      onChange={(e) => handleReschedule(lead._id, e.target.value, lead.meetingTime)}
                      className="sales-form-input"
                      style={{ padding: "4px 8px", width: "120px", fontSize: "11px" }}
                    />
                  </div>

                  <button
                    onClick={() => handleMarkComplete(lead._id)}
                    className="sales-btn primary"
                    style={{ padding: "6px 12px", fontSize: "11px" }}
                  >
                    <Check size={12} /> Mark as Finished
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
