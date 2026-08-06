import React, { useState, useEffect } from "react";
import {
  Search,
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
  CheckCircle
} from "lucide-react";
import { getLeads, saveLeads, addActivity } from "../utils/dummyData";
import "../components/SalesDepartment.css";

export default function SalesCustomers() {
  const [allLeads, setAllLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("leadId");
  const [sortOrder, setSortOrder] = useState("asc");

  // Modals
  const [viewCustomer, setViewCustomer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    loanType: "Business Loan",
    loanAmount: "",
    cibilScore: "",
    address: ""
  });
  const [formErrors, setFormErrors] = useState({});

  // Toast
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
    }, 500);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter and Sort Customers
  useEffect(() => {
    let filtered = allLeads.filter(l => l.stage === "Won");

    // Search
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        c =>
          (c.companyName || "").toLowerCase().includes(query) ||
          (c.contactPerson || "").toLowerCase().includes(query) ||
          (c.leadId || "").toLowerCase().includes(query)
      );
    }

    // Sort
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

    setCustomers(filtered);
  }, [allLeads, search, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      companyName: customer.companyName || "",
      contactPerson: customer.contactPerson || "",
      phone: customer.phone || "",
      email: customer.email || "",
      loanType: customer.loanType || "Business Loan",
      loanAmount: customer.loanAmount || "",
      cibilScore: customer.cibilScore || "",
      address: customer.address || ""
    });
    setFormErrors({});
    setShowEditModal(true);
  };

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

  const validateForm = () => {
    const errors = {};
    if (!formData.companyName.trim()) errors.companyName = "Company name is required";
    if (!formData.contactPerson.trim()) errors.contactPerson = "Contact person is required";
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      errors.phone = "Phone number must be 10 digits";
    }
    if (formData.email.trim()) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regex.test(formData.email.trim())) {
        errors.email = "Invalid email format";
      }
    }
    if (!formData.loanAmount || isNaN(formData.loanAmount)) {
      errors.loanAmount = "Valid loan amount is required";
    }
    return errors;
  };

  // Handle Edit Save
  const handleSave = (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const updatedList = [...allLeads];
    const index = updatedList.findIndex(l => l._id === editingCustomer._id);
    if (index !== -1) {
      const updated = {
        ...editingCustomer,
        ...formData,
        loanAmount: parseFloat(formData.loanAmount),
        cibilScore: parseInt(formData.cibilScore)
      };
      updatedList[index] = updated;
      saveLeads(updatedList);
      setAllLeads(updatedList);
      addActivity(`Updated customer info: ${formData.companyName}`, "edit");
      showToast("Customer profile updated!", "success");
      setShowEditModal(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    const customerToDelete = allLeads.find(l => l._id === deleteConfirm);
    const updated = allLeads.filter(l => l._id !== deleteConfirm);
    saveLeads(updated);
    setAllLeads(updated);
    if (customerToDelete) {
      addActivity(`Removed customer record: ${customerToDelete.companyName}`, "delete");
    }
    showToast("Customer profile deleted!", "success");
    setDeleteConfirm(null);
  };

  const formatCurrency = (val) => {
    return "₹" + (val || 0).toLocaleString();
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
      <div className="sales-title-banner green-border">
        <p>MHAVEER FINCAP CLIENTS</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <h1>Active Customers Directory</h1>
          <button onClick={loadData} className="sales-btn secondary">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Directory
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="sales-filter-card">
        <div className="sales-search-box" style={{ maxWidth: "100%" }}>
          <Search className="sales-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search customers by company, representative, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sales-search-box-input"
          />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="sales-table-card">
        {loading ? (
          <div className="sales-loading-state">
            <div className="sales-spinner"></div>
            <span className="sales-loading-text">Syncing Directory...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="sales-empty-state">
            <h4 className="sales-empty-state-title">No Active Customers</h4>
            <p className="sales-empty-state-desc">
              There are no active customers matching the criteria. Note that customers are automatically generated from leads successfully won in the sales pipeline!
            </p>
          </div>
        ) : (
          <div className="sales-table-wrapper">
            <table className="sales-table">
              <thead>
                <tr>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("leadId")}>
                    CUSTOMER ID {sortField === "leadId" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("companyName")}>
                    COMPANY NAME {sortField === "companyName" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th>REPRESENTATIVE</th>
                  <th>PHONE</th>
                  <th>LOAN PORTFOLIO</th>
                  <th style={{ cursor: "pointer", textAlign: "right" }} onClick={() => handleSort("loanAmount")}>
                    REVENUE DISBURSED {sortField === "loanAmount" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th style={{ textAlign: "center" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id}>
                    <td className="sales-table-lead-id">{c.leadId.replace("SLS", "CST")}</td>
                    <td className="sales-table-bold">{c.companyName}</td>
                    <td>{c.contactPerson}</td>
                    <td>{c.phone}</td>
                    <td>{c.loanType}</td>
                    <td style={{ textAlign: "right", fontWeight: 800, color: "#16a34a" }}>
                      {formatCurrency(c.loanAmount)}
                    </td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                        <button
                          onClick={() => setViewCustomer(c)}
                          className="sales-nav-icon-btn"
                          title="View Profile Details"
                          style={{ color: "#475569" }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="sales-nav-icon-btn"
                          title="Edit Customer Profile"
                          style={{ color: "#d4af37" }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(c._id)}
                          className="sales-nav-icon-btn"
                          title="Remove Customer Record"
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
          </div>
        )}
      </div>

      {/* VIEW CUSTOMER DETAIL MODAL */}
      {viewCustomer && (
        <div className="sales-modal-backdrop" onClick={() => setViewCustomer(null)}>
          <div className="sales-modal large" onClick={(e) => e.stopPropagation()}>
            <div className="sales-modal-header">
              <h3 className="sales-modal-title">
                <User size={20} className="text-[#0a2540]" /> Customer Profile - {viewCustomer.companyName}
              </h3>
              <button onClick={() => setViewCustomer(null)} className="sales-modal-close-btn">
                <X size={18} />
              </button>
            </div>
            <div className="sales-modal-body">
              <div className="sales-detail-section">
                <div className="sales-detail-card">
                  <h4 className="sales-detail-card-header">General Information</h4>
                  <div className="sales-detail-grid">
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">Customer ID</span>
                      <span className="sales-detail-value">{viewCustomer.leadId.replace("SLS", "CST")}</span>
                    </div>
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">Company Name</span>
                      <span className="sales-detail-value">{viewCustomer.companyName}</span>
                    </div>
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">Primary Contact Representative</span>
                      <span className="sales-detail-value">{viewCustomer.contactPerson}</span>
                    </div>
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">Phone Number</span>
                      <span className="sales-detail-value">{viewCustomer.phone}</span>
                    </div>
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">Email Address</span>
                      <span className="sales-detail-value">{viewCustomer.email || "N/A"}</span>
                    </div>
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">CIBIL Score Verification</span>
                      <span className="sales-detail-value">{viewCustomer.cibilScore}</span>
                    </div>
                  </div>
                </div>

                <div className="sales-detail-card">
                  <h4 className="sales-detail-card-header">Disbursed Finance Details</h4>
                  <div className="sales-detail-grid">
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">Active Loan Portfolio</span>
                      <span className="sales-detail-value">{viewCustomer.loanType}</span>
                    </div>
                    <div className="sales-detail-item">
                      <span className="sales-detail-label">Disbursed Capital (INR)</span>
                      <span className="sales-detail-value" style={{ color: "#16a34a" }}>
                        {formatCurrency(viewCustomer.loanAmount)}
                      </span>
                    </div>
                    <div className="sales-detail-item" style={{ gridColumn: "span 2" }}>
                      <span className="sales-detail-label">Business Registered Address</span>
                      <span className="sales-detail-value" style={{ fontWeight: "normal" }}>
                        {viewCustomer.address || "No address logged"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="sales-modal-footer">
              <button onClick={() => setViewCustomer(null)} className="sales-btn secondary">
                Close Profile
              </button>
              <button
                onClick={() => {
                  handleOpenEdit(viewCustomer);
                  setViewCustomer(null);
                }}
                className="sales-btn primary"
              >
                Edit Customer Info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {showEditModal && (
        <div className="sales-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="sales-modal large" onClick={(e) => e.stopPropagation()}>
            <div className="sales-modal-header">
              <h3 className="sales-modal-title">
                <Edit2 size={18} /> Edit Customer Profile
              </h3>
              <button onClick={() => setShowEditModal(false)} className="sales-modal-close-btn">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="sales-modal-body">
                <div className="sales-form-grid two-cols">
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

                  <div className="sales-form-group">
                    <label className="sales-form-label">Representative Name *</label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      className="sales-form-input"
                    />
                    {formErrors.contactPerson && <span className="sales-form-error">{formErrors.contactPerson}</span>}
                  </div>

                  <div className="sales-form-group">
                    <label className="sales-form-label">Phone *</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="sales-form-input"
                    />
                    {formErrors.phone && <span className="sales-form-error">{formErrors.phone}</span>}
                  </div>

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

                  <div className="sales-form-group">
                    <label className="sales-form-label">Active Portfolio</label>
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

                  <div className="sales-form-group">
                    <label className="sales-form-label">Capital Disbursed (INR) *</label>
                    <input
                      type="number"
                      name="loanAmount"
                      value={formData.loanAmount}
                      onChange={handleInputChange}
                      className="sales-form-input"
                    />
                    {formErrors.loanAmount && <span className="sales-form-error">{formErrors.loanAmount}</span>}
                  </div>

                  <div className="sales-form-group span-2">
                    <label className="sales-form-label">Registered Office Address</label>
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
                  onClick={() => setShowEditModal(false)}
                  className="sales-btn secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="sales-btn primary">
                  Save Details
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
                <AlertTriangle size={20} /> Remove Client Record
              </h3>
            </div>
            <div className="sales-modal-body" style={{ padding: "0.5rem 1.5rem 1.5rem 1.5rem" }}>
              <p style={{ fontSize: "14px", margin: 0, color: "#475569", lineHeight: "1.5" }}>
                Are you sure you want to delete this customer record? Deleting a customer will erase their portfolio log from this local session.
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
