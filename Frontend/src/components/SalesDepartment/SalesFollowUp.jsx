import React, { useState, useEffect } from "react";
import {
  Clock,
  Phone,
  Calendar,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Check
} from "lucide-react";
import { getLeads, saveLeads, addActivity } from "./dummyData";
import "./SalesDepartment.css";

export default function SalesFollowUp() {
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
        // Log activity
        addActivity(`Follow-up completed with ${lead.companyName}`, "followup_complete");
        return {
          ...lead,
          followUpCompleted: true
        };
      }
      return lead;
    });

    saveLeads(updated);
    setLeads(updated);
    showToast("Follow-up marked as completed!", "success");
  };

  const handleReschedule = (leadId, date, time) => {
    if (!date) return;
    const updated = leads.map(lead => {
      if (lead._id === leadId) {
        addActivity(`Rescheduled follow-up with ${lead.companyName} to ${date}`, "followup_reschedule");
        return {
          ...lead,
          followUpDate: date,
          followUpTime: time || "12:00",
          followUpCompleted: false
        };
      }
      return lead;
    });

    saveLeads(updated);
    setLeads(updated);
    showToast("Follow-up rescheduled successfully!", "success");
  };

  // Get current date for checking Overdue status
  const todayStr = new Date().toISOString().split("T")[0];

  // Filters leads
  const filteredLeads = leads.filter(lead => {
    // Must have followUpDate set
    if (!lead.followUpDate) return false;

    // Search
    const matchSearch =
      lead.companyName.toLowerCase().includes(search.toLowerCase()) ||
      lead.contactPerson.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;

    if (activeTab === "completed") {
      return lead.followUpCompleted === true;
    } else {
      // upcoming/pending/overdue (not completed)
      return !lead.followUpCompleted;
    }
  });

  const getStatusLabel = (lead) => {
    if (lead.followUpCompleted) {
      return <span className="sales-badge success"><CheckCircle size={10} /> Completed</span>;
    }

    if (lead.followUpDate < todayStr) {
      return <span className="sales-badge danger"><AlertTriangle size={10} /> Overdue</span>;
    }

    return <span className="sales-badge warning"><Clock size={10} /> Pending</span>;
  };

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
      <div className="sales-title-banner blue-border">
        <p>FOLLOW-UP LOGS</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <h1>Client Call Backs & Follow-ups</h1>
          <button onClick={loadData} className="sales-btn secondary">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="sales-tabs">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`sales-tab-btn ${activeTab === "upcoming" ? "active" : ""}`}
        >
          Upcoming Call Backs
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`sales-tab-btn ${activeTab === "completed" ? "active" : ""}`}
        >
          Completed Follow-ups
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="sales-filter-card">
        <div className="sales-search-box" style={{ maxWidth: "100%" }}>
          <Search className="sales-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search by client name, contact representative..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sales-search-box-input"
          />
        </div>
      </div>

      {/* Follow-up Content List */}
      {loading ? (
        <div className="sales-loading-state">
          <div className="sales-spinner"></div>
          <span className="sales-loading-text">Syncing Call logs...</span>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="sales-empty-state">
          <h4 className="sales-empty-state-title">No Follow-ups Scheduled</h4>
          <p className="sales-empty-state-desc">
            There are no follow-ups found in this list. Excellent work keeping up with all your clients!
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
          {filteredLeads.map((lead) => (
            <div
              key={lead._id}
              className="sales-widget-card"
              style={{ padding: "1.25rem", borderLeft: lead.followUpCompleted ? "6px solid #16a34a" : (lead.followUpDate < todayStr ? "6px solid #dc2626" : "6px solid #d4af37") }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "flex-start", gap: "10px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span className="sales-table-lead-id">{lead.leadId}</span>
                    {getStatusLabel(lead)}
                  </div>
                  <h3 className="sales-table-bold" style={{ margin: "6px 0 2px 0", fontSize: "14px" }}>
                    {lead.companyName}
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                    Rep: {lead.contactPerson} | Phone: {lead.phone}
                  </p>
                </div>

                {/* Date/Time widget */}
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
                    Call Time Set
                  </p>
                  <p style={{ margin: "2px 0 0 0", color: "#0a2540", fontWeight: 900, display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={12} className="text-[#d4af37]" /> {lead.followUpDate} at {lead.followUpTime || "12:00"}
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
                    fontStyle: "italic",
                    border: "1px dashed #cbd5e1"
                  }}
                >
                  Remarks/Addr: {lead.address}
                </div>
              )}

              {/* Actions panel */}
              {!lead.followUpCompleted && (
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
                      defaultValue={lead.followUpDate}
                      onChange={(e) => handleReschedule(lead._id, e.target.value, lead.followUpTime)}
                      className="sales-form-input"
                      style={{ padding: "4px 8px", width: "120px", fontSize: "11px" }}
                    />
                  </div>

                  <button
                    onClick={() => handleMarkComplete(lead._id)}
                    className="sales-btn primary"
                    style={{ padding: "6px 12px", fontSize: "11px" }}
                  >
                    <Check size={12} /> Mark as Completed
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
