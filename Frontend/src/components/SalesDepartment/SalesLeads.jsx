import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  AlertTriangle,
  User,
  Phone,
  Briefcase,
  DollarSign,
  MapPin,
  Calendar,
  CheckCircle,
  Clock
} from "lucide-react";
import { getLeads, saveLeads, addActivity } from "./dummyData";
import "./SalesDepartment.css";

export default function SalesLeads() {
  const [allLeads, setAllLeads] = useState([]);
  const [leads, setLeads] = useState([]);
  
  // States
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [loanFilter, setLoanFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [sortField, setSortField] = useState("leadId");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [viewLead, setViewLead] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    loanType: "Business Loan",
    propertyLoanCategory: "",
    loanAmount: "",
    cibilScore: "",
    stage: "New Lead",
    interested: "Yes",
    callStatus: "Connected",
    meetingDate: "",
    meetingTime: "",
    followUpDate: "",
    followUpTime: "",
    address: ""
  });
  const [formErrors, setFormErrors] = useState({});

  // Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      const data = getLeads();
      setAllLeads(data);
      setLoading(false);
    }, 600);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter, Sort and Paginate
  useEffect(() => {
    let filtered = [...allLeads];

    // Search
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        l =>
          (l.companyName || "").toLowerCase().includes(query) ||
          (l.contactPerson || "").toLowerCase().includes(query) ||
          (l.leadId || "").toLowerCase().includes(query)
      );
    }

    // Loan Filter
    if (loanFilter) {
      filtered = filtered.filter(l => l.loanType === loanFilter);
    }

    // Stage Filter
    if (stageFilter) {
      filtered = filtered.filter(l => l.stage === stageFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "loanAmount" || sortField === "cibilScore") {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else {
        aVal = (aVal || "").toString().toLowerCase();
        bVal = (bVal || "").toString().toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    // Pagination Calculation
    const pages = Math.ceil(filtered.length / itemsPerPage) || 1;
    setTotalPages(pages);

    // If current page exceeds total pages, reset to page 1
    const currentPage = page > pages ? 1 : page;
    if (currentPage !== page) {
      setPage(currentPage);
    }

    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    setLeads(paginated);
  }, [allLeads, search, loanFilter, stageFilter, sortField, sortOrder, page]);

  // Toggle Sorting helper
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingLead(null);
    setFormData({
      companyName: "",
      contactPerson: "",
      phone: "",
      email: "",
      loanType: "Business Loan",
      propertyLoanCategory: "",
      loanAmount: "",
      cibilScore: "",
      stage: "New Lead",
      interested: "Yes",
      callStatus: "Connected",
      meetingDate: "",
      meetingTime: "",
      followUpDate: "",
      followUpTime: "",
      address: ""
    });
    setFormErrors({});
    setShowAddEditModal(true);
  };

  // Open modal for edit
  const handleOpenEdit = (lead) => {
    setEditingLead(lead);
    setFormData({
      companyName: lead.companyName || "",
      contactPerson: lead.contactPerson || "",
      phone: lead.phone || "",
      email: lead.email || "",
      loanType: lead.loanType || "Business Loan",
      propertyLoanCategory: lead.propertyLoanCategory || "",
      loanAmount: lead.loanAmount || "",
      cibilScore: lead.cibilScore || "",
      stage: lead.stage || "New Lead",
      interested: lead.interested || "Yes",
      callStatus: lead.callStatus || "Connected",
      meetingDate: lead.meetingDate || "",
      meetingTime: lead.meetingTime || "",
      followUpDate: lead.followUpDate || "",
      followUpTime: lead.followUpTime || "",
      address: lead.address || ""
    });
    setFormErrors({});
    setShowAddEditModal(true);
  };

  // Handle Form Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.companyName.trim()) errors.companyName = "Company name is required";
    if (!formData.contactPerson.trim()) errors.contactPerson = "Contact person is required";
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      errors.phone = "Phone number must be exactly 10 digits";
    }
    if (formData.email.trim()) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regex.test(formData.email.trim())) {
        errors.email = "Please enter a valid email address";
      }
    }
    if (!formData.loanAmount) {
      errors.loanAmount = "Loan amount is required";
    } else if (isNaN(formData.loanAmount) || parseFloat(formData.loanAmount) <= 0) {
      errors.loanAmount = "Loan amount must be a positive number";
    }
    if (!formData.cibilScore) {
      errors.cibilScore = "CIBIL Score is required";
    } else {
      const score = parseInt(formData.cibilScore);
      if (isNaN(score) || score < 300 || score > 900) {
        errors.cibilScore = "CIBIL Score must be between 300 and 900";
      }
    }
    return errors;
  };

  // Handle Save Lead (Create or Update)
  const handleSave = (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const updatedList = [...allLeads];

    if (editingLead) {
      // Update
      const index = updatedList.findIndex(l => l._id === editingLead._id);
      if (index !== -1) {
        const updated = {
          ...editingLead,
          ...formData,
          loanAmount: parseFloat(formData.loanAmount),
          cibilScore: parseInt(formData.cibilScore)
        };
        updatedList[index] = updated;
        saveLeads(updatedList);
        setAllLeads(updatedList);
        addActivity(`Updated lead info: ${formData.companyName}`, "edit");
        showToast("Lead updated successfully!", "success");
      }
    } else {
      // Create
      const newLead = {
        _id: "lead-" + Date.now(),
        leadId: "SLS-2026-" + String(updatedList.length + 1).padStart(3, "0"),
        ...formData,
        loanAmount: parseFloat(formData.loanAmount),
        cibilScore: parseInt(formData.cibilScore)
      };
      const final = [newLead, ...updatedList];
      saveLeads(final);
      setAllLeads(final);
      addActivity(`Added new lead: ${formData.companyName}`, "add");
      showToast("Lead registered successfully!", "success");
    }

    setShowAddEditModal(false);
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    const leadToDelete = allLeads.find(l => l._id === deleteConfirm);
    const updated = allLeads.filter(l => l._id !== deleteConfirm);
    saveLeads(updated);
    setAllLeads(updated);
    if (leadToDelete) {
      addActivity(`Deleted lead: ${leadToDelete.companyName}`, "delete");
    }
    showToast("Lead removed successfully!", "success");
    setDeleteConfirm(null);
  };

  // Format Currency
  const formatCurrency = (val) => {
    return "₹" + (val || 0).toLocaleString();
  };

  return (
    <div className="sales-stack">
      {/* Toast Notification */}
      {toast && (
        <div className="sales-toast-container">
          <div className={`sales-toast ${toast.type}`}>
            {toast.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span className="sales-toast-text">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header Panel */}
      <div className="sales-title-banner blue-border">
        <p>MHAVEER FINCAP CRM</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <h1>Sales Leads Directory</h1>
          <button onClick={handleOpenAdd} className="sales-btn gold">
            <Plus size={16} /> Add New Lead
          </button>
        </div>
      </div>

      {/* Filter and Search Card */}
      <div className="sales-filter-card">
        {/* Search */}
        <div className="sales-search-box">
          <Search className="sales-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search company, contact person or Lead ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="sales-search-box-input"
          />
        </div>

        {/* Filters */}
        <div className="sales-filter-actions">
          <select
            value={loanFilter}
            onChange={(e) => {
              setLoanFilter(e.target.value);
              setPage(1);
            }}
            className="sales-select-filter"
          >
            <option value="">All Loan Types</option>
            <option value="Home Loan">Home Loan</option>
            <option value="Business Loan">Business Loan</option>
            <option value="Property Loan">Property Loan</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value);
              setPage(1);
            }}
            className="sales-select-filter"
          >
            <option value="">All Pipeline Stages</option>
            <option value="New Lead">New Lead</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Proposal Sent">Proposal Sent</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Won">Won Deals</option>
            <option value="Lost">Lost Deals</option>
          </select>

          <button onClick={loadData} className="sales-btn secondary" title="Sync leads">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="sales-table-card">
        {loading ? (
          <div className="sales-loading-state">
            <div className="sales-spinner"></div>
            <span className="sales-loading-text">Syncing CRM Logs...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="sales-empty-state">
            <h4 className="sales-empty-state-title">No Leads Found</h4>
            <p className="sales-empty-state-desc">
              We couldn't find any matching lead records. Try refining your search query or adjusting active filters.
            </p>
          </div>
        ) : (
          <div className="sales-table-wrapper">
            <table className="sales-table">
              <thead>
                <tr>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("leadId")}>
                    LEAD ID {sortField === "leadId" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("companyName")}>
                    COMPANY NAME {sortField === "companyName" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th>CONTACT PERSON</th>
                  <th>PHONE</th>
                  <th>LOAN TYPE</th>
                  <th style={{ cursor: "pointer", textAlign: "center" }} onClick={() => handleSort("cibilScore")}>
                    CIBIL {sortField === "cibilScore" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th style={{ textAlign: "center" }}>STAGE</th>
                  <th style={{ textAlign: "center" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead._id}>
                    <td className="sales-table-lead-id">{lead.leadId}</td>
                    <td className="sales-table-bold">{lead.companyName}</td>
                    <td>{lead.contactPerson}</td>
                    <td>{lead.phone}</td>
                    <td>{lead.loanType}</td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className={`sales-badge ${
                          lead.cibilScore >= 750 ? "success" : lead.cibilScore >= 650 ? "warning" : "danger"
                        }`}
                      >
                        {lead.cibilScore}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className={`sales-badge ${
                          lead.stage === "Won" ? "success" : lead.stage === "Lost" ? "danger" : "blue"
                        }`}
                      >
                        {lead.stage}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                        <button
                          onClick={() => setViewLead(lead)}
                          className="sales-nav-icon-btn"
                          title="View Profile"
                          style={{ color: "#475569" }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(lead)}
                          className="sales-nav-icon-btn"
                          title="Edit Details"
                          style={{ color: "#d4af37" }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(lead._id)}
                          className="sales-nav-icon-btn"
                          title="Delete Lead"
                          style={{ color: "#ef4444" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="sales-pagination">
                <span className="sales-pagination-info">
                  Page {page} of {totalPages}
                </span>
                <div className="sales-pagination-actions">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="sales-btn secondary"
                    style={{ padding: "0.4rem 0.8rem", fontSize: "11px" }}
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="sales-btn secondary"
                    style={{ padding: "0.4rem 0.8rem", fontSize: "11px" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* VIEW LEAD MODAL */}
      {viewLead && (
        <div className="sales-modal-backdrop" onClick={() => setViewLead(null)}>
          <div className="sales-modal large" onClick={(e) => e.stopPropagation()}>
            <div className="sales-modal-header">
              <h3 className="sales-modal-title">
                <Briefcase size={20} className="text-[#0a2540]" /> Lead Profile - {viewLead.companyName}
              </h3>
              <button onClick={() => setViewLead(null)} className="sales-modal-close-btn">
                <X size={18} />
              </button>
            </div>
            <div className="sales-modal-body">
              <div className="sales-detail-section">
                <div className="sales-detail-card">
                  <h4 className="sales-detail-card-header">General Information</h4>
                  <div className="sales-detail-grid">
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">Lead ID</span>
                      <span className="sales-detail-value">{viewLead.leadId}</span>
                    </div>
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">Company Name</span>
                      <span className="sales-detail-value">{viewLead.companyName}</span>
                    </div>
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">Contact Person</span>
                      <span className="sales-detail-value">{viewLead.contactPerson}</span>
                    </div>
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">Phone Number</span>
                      <span className="sales-detail-value">{viewLead.phone}</span>
                    </div>
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">Email Address</span>
                      <span className="sales-detail-value">{viewLead.email || "N/A"}</span>
                    </div>
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">CIBIL Score</span>
                      <span className="sales-detail-value">{viewLead.cibilScore}</span>
                    </div>
                  </div>
                </div>

                <div className="sales-detail-card">
                  <h4 className="sales-detail-card-header">Financials & Loan Request</h4>
                  <div className="sales-detail-grid">
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">Loan Type</span>
                      <span className="sales-detail-value">{viewLead.loanType}</span>
                    </div>
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">Loan Amount</span>
                      <span className="sales-detail-value">{formatCurrency(viewLead.loanAmount)}</span>
                    </div>
                    {viewLead.propertyLoanCategory && (
                      <div className="sales-detail-item">
                        <span className="sales-detail-label">Property Category</span>
                        <span className="sales-detail-value">{viewLead.propertyLoanCategory}</span>
                      </div>
                    )}
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">Current Pipeline Stage</span>
                      <span className="sales-detail-value">{viewLead.stage}</span>
                    </div>
                  </div>
                </div>

                <div className="sales-detail-card">
                  <h4 className="sales-detail-card-header">Activity Plan</h4>
                  <div className="sales-detail-grid">
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">Scheduled Consultation</span>
                      <span className="sales-detail-value">
                        {viewLead.meetingDate
                          ? `${viewLead.meetingDate} at ${viewLead.meetingTime || "N/A"}`
                          : "None Scheduled"}
                      </span>
                    </div>
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">Follow-up Call Back</span>
                      <span className="sales-detail-value">
                        {viewLead.followUpDate
                          ? `${viewLead.followUpDate} at ${viewLead.followUpTime || "N/A"}`
                          : "None Scheduled"}
                      </span>
                    </div>
                    <div className="sales-detail-item" style={{ gridColumn: "span 2" }}>
                      <span className="sales-detail-label">Office / Business Address</span>
                      <span className="sales-detail-value" style={{ fontWeight: "normal" }}>
                        {viewLead.address || "No address details logged"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="sales-modal-footer">
              <button onClick={() => setViewLead(null)} className="sales-btn secondary">
                Close Profile
              </button>
              <button
                onClick={() => {
                  handleOpenEdit(viewLead);
                  setViewLead(null);
                }}
                className="sales-btn primary"
              >
                Edit Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT LEAD MODAL */}
      {showAddEditModal && (
        <div className="sales-modal-backdrop" onClick={() => setShowAddEditModal(false)}>
          <div className="sales-modal large" onClick={(e) => e.stopPropagation()}>
            <div className="sales-modal-header">
              <h3 className="sales-modal-title">
                <Briefcase size={20} /> {editingLead ? `Modify Lead - ${editingLead.leadId}` : "Register New Lead"}
              </h3>
              <button onClick={() => setShowAddEditModal(false)} className="sales-modal-close-btn">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="sales-modal-body">
                <div className="sales-form-grid two-cols">
                  {/* Company Name */}
                  <div className="sales-form-group">
                    <label className="sales-form-label">Company Name *</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="sales-form-input"
                    />
                    {formErrors.companyName && <span className="sales-form-error">{formErrors.companyName}</span>}
                  </div>

                  {/* Contact Person */}
                  <div className="sales-form-group">
                    <label className="sales-form-label">Contact Person *</label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      className="sales-form-input"
                    />
                    {formErrors.contactPerson && <span className="sales-form-error">{formErrors.contactPerson}</span>}
                  </div>

                  {/* Phone */}
                  <div className="sales-form-group">
                    <label className="sales-form-label">Phone *</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. 9876543210"
                      className="sales-form-input"
                    />
                    {formErrors.phone && <span className="sales-form-error">{formErrors.phone}</span>}
                  </div>

                  {/* Email */}
                  <div className="sales-form-group">
                    <label className="sales-form-label">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="sales-form-input"
                    />
                    {formErrors.email && <span className="sales-form-error">{formErrors.email}</span>}
                  </div>

                  {/* Loan Type */}
                  <div className="sales-form-group">
                    <label className="sales-form-label">Loan Type *</label>
                    <select
                      name="loanType"
                      value={formData.loanType}
                      onChange={handleInputChange}
                      className="sales-select-filter"
                      style={{ padding: "0.625rem 0.875rem" }}
                    >
                      <option value="Home Loan">Home Loan</option>
                      <option value="Business Loan">Business Loan</option>
                      <option value="Property Loan">Property Loan</option>
                    </select>
                  </div>

                  {/* Property Category (Conditional) */}
                  {formData.loanType === "Property Loan" && (
                    <div className="sales-form-group">
                      <label className="sales-form-label">Property Category</label>
                      <input
                        type="text"
                        name="propertyLoanCategory"
                        value={formData.propertyLoanCategory}
                        onChange={handleInputChange}
                        placeholder="e.g. Commercial Office, Factory"
                        className="sales-form-input"
                      />
                    </div>
                  )}

                  {/* Loan Amount */}
                  <div className="sales-form-group">
                    <label className="sales-form-label">Loan Amount (INR) *</label>
                    <input
                      type="number"
                      name="loanAmount"
                      value={formData.loanAmount}
                      onChange={handleInputChange}
                      placeholder="e.g. 500000"
                      className="sales-form-input"
                    />
                    {formErrors.loanAmount && <span className="sales-form-error">{formErrors.loanAmount}</span>}
                  </div>

                  {/* CIBIL Score */}
                  <div className="sales-form-group">
                    <label className="sales-form-label">CIBIL Score (300-900) *</label>
                    <input
                      type="number"
                      name="cibilScore"
                      value={formData.cibilScore}
                      onChange={handleInputChange}
                      className="sales-form-input"
                    />
                    {formErrors.cibilScore && <span className="sales-form-error">{formErrors.cibilScore}</span>}
                  </div>

                  {/* Pipeline Stage */}
                  <div className="sales-form-group">
                    <label className="sales-form-label">Pipeline Stage</label>
                    <select
                      name="stage"
                      value={formData.stage}
                      onChange={handleInputChange}
                      className="sales-select-filter"
                      style={{ padding: "0.625rem 0.875rem" }}
                    >
                      <option value="New Lead">New Lead</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Proposal Sent">Proposal Sent</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>

                  {/* Interested Level */}
                  <div className="sales-form-group">
                    <label className="sales-form-label">Interest Level</label>
                    <select
                      name="interested"
                      value={formData.interested}
                      onChange={handleInputChange}
                      className="sales-select-filter"
                      style={{ padding: "0.625rem 0.875rem" }}
                    >
                      <option value="Yes">Interested (Yes)</option>
                      <option value="No">Not Interested (No)</option>
                      <option value="Call Back Later">Call Back Later</option>
                    </select>
                  </div>

                  {/* Call Status */}
                  <div className="sales-form-group">
                    <label className="sales-form-label">Call Status</label>
                    <input
                      type="text"
                      name="callStatus"
                      value={formData.callStatus}
                      onChange={handleInputChange}
                      placeholder="e.g. Connected, Busy"
                      className="sales-form-input"
                    />
                  </div>

                  {/* Meeting Date */}
                  <div className="sales-form-group">
                    <label className="sales-form-label">Meeting Consultation Date</label>
                    <input
                      type="date"
                      name="meetingDate"
                      value={formData.meetingDate}
                      onChange={handleInputChange}
                      className="sales-form-input"
                    />
                  </div>

                  {/* Meeting Time */}
                  <div className="sales-form-group">
                    <label className="sales-form-label">Meeting Time</label>
                    <input
                      type="time"
                      name="meetingTime"
                      value={formData.meetingTime}
                      onChange={handleInputChange}
                      className="sales-form-input"
                    />
                  </div>

                  {/* Follow Up Date */}
                  <div className="sales-form-group">
                    <label className="sales-form-label">Follow-up Call Back Date</label>
                    <input
                      type="date"
                      name="followUpDate"
                      value={formData.followUpDate}
                      onChange={handleInputChange}
                      className="sales-form-input"
                    />
                  </div>

                  {/* Follow Up Time */}
                  <div className="sales-form-group">
                    <label className="sales-form-label">Follow-up Time</label>
                    <input
                      type="time"
                      name="followUpTime"
                      value={formData.followUpTime}
                      onChange={handleInputChange}
                      className="sales-form-input"
                    />
                  </div>

                  {/* Address */}
                  <div className="sales-form-group span-2">
                    <label className="sales-form-label">Company Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="sales-form-input"
                      rows={3}
                      style={{ resize: "none" }}
                    />
                  </div>
                </div>
              </div>
              <div className="sales-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="sales-btn secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="sales-btn primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="sales-modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="sales-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sales-modal-header" style={{ borderBottom: "none" }}>
              <h3 className="sales-modal-title" style={{ color: "#dc2626" }}>
                <AlertTriangle size={20} /> Delete Confirmation
              </h3>
            </div>
            <div className="sales-modal-body" style={{ padding: "0.5rem 1.5rem 1.5rem 1.5rem" }}>
              <p style={{ fontSize: "14px", margin: 0, color: "#475569", lineHeight: "1.5" }}>
                Are you sure you want to permanently delete this lead record? This action is irreversible and will remove all histories from the CRM.
              </p>
            </div>
            <div className="sales-modal-footer" style={{ borderTop: "none" }}>
              <button onClick={() => setDeleteConfirm(null)} className="sales-btn secondary">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="sales-btn danger">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
