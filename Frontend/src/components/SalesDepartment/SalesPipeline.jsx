import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Layers, RefreshCw, CheckCircle } from "lucide-react";
import { getLeads, saveLeads, addActivity } from "./dummyData";
import "./SalesDepartment.css";

const STAGES = [
  "New Lead",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost"
];

export default function SalesPipeline() {
  const [leads, setLeads] = useState([]);
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
      setLoading(false);
    }, 450);
  };

  useEffect(() => {
    loadData();
  }, []);

  const moveCard = (leadId, direction) => {
    const lead = leads.find(l => l._id === leadId);
    if (!lead) return;

    const currentIndex = STAGES.indexOf(lead.stage);
    let nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= STAGES.length) return;

    const nextStage = STAGES[nextIndex];

    const updated = leads.map(l => {
      if (l._id === leadId) {
        addActivity(`Moved ${l.companyName} to ${nextStage} stage`, "stage_change");
        return {
          ...l,
          stage: nextStage
        };
      }
      return l;
    });

    saveLeads(updated);
    setLeads(updated);
    showToast(`Moved to "${nextStage}"`);
  };

  const formatCurrency = (val) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(1)} Cr`;
    } else if (val >= 100000) {
      return `₹${(val / 100000).toFixed(0)} L`;
    }
    return `₹${val.toLocaleString()}`;
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
        <p>DEAL FLOW KANBAN</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <h1>Interactive Sales Pipeline</h1>
          <button onClick={loadData} className="sales-btn secondary">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Pipeline
          </button>
        </div>
      </div>

      {loading ? (
        <div className="sales-loading-state">
          <div className="sales-spinner"></div>
          <span className="sales-loading-text">Loading Kanban Board...</span>
        </div>
      ) : (
        <div className="sales-pipeline-container">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage);
            return (
              <div className="sales-pipeline-column" key={stage}>
                <div className="sales-pipeline-header">
                  <h4 className="sales-pipeline-title">{stage}</h4>
                  <span className="sales-pipeline-count">{stageLeads.length}</span>
                </div>
                <div className="sales-pipeline-stack">
                  {stageLeads.length === 0 ? (
                    <div
                      style={{
                        padding: "20px 10px",
                        textAlign: "center",
                        fontSize: "11px",
                        color: "#94a3b8",
                        border: "1px dashed #cbd5e1",
                        borderRadius: "10px"
                      }}
                    >
                      No leads here
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      const currentIndex = STAGES.indexOf(stage);
                      const canMoveLeft = currentIndex > 0;
                      const canMoveRight = currentIndex < STAGES.length - 1;

                      return (
                        <div className="sales-pipeline-card" key={lead._id}>
                          <span className="sales-pipeline-card-id">{lead.leadId}</span>
                          <h5 className="sales-pipeline-card-title">{lead.companyName}</h5>
                          <p className="sales-pipeline-card-person">Rep: {lead.contactPerson}</p>
                          <div className="sales-pipeline-card-footer">
                            <span className="sales-pipeline-card-amount">
                              {formatCurrency(lead.loanAmount)}
                            </span>
                            <div className="sales-pipeline-move-btns">
                              {canMoveLeft && (
                                <button
                                  onClick={() => moveCard(lead._id, -1)}
                                  className="sales-pipeline-move-btn"
                                  title="Move stage back"
                                >
                                  <ChevronLeft size={12} />
                                </button>
                              )}
                              {canMoveRight && (
                                <button
                                  onClick={() => moveCard(lead._id, 1)}
                                  className="sales-pipeline-move-btn"
                                  title="Move stage forward"
                                >
                                  <ChevronRight size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
