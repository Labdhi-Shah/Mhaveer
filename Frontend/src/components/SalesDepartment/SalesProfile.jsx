import React, { useState, useEffect } from "react";
import { User, Key, Camera, CheckCircle, AlertTriangle } from "lucide-react";
import "./SalesDepartment.css";

export default function SalesProfile() {
  const [user, setUser] = useState({
    name: "Sales Officer",
    email: "sales@mhaveerfincap.com",
    role: "Sales Representative",
    employeeId: "SLS-40291",
    branch: "Corporate Gujarat",
    avatar: "" // base64 or blob URL
  });

  // Password fields
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordErrors, setPasswordErrors] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Profile picture upload
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        showToast("Please upload an image file (PNG/JPG)", "error");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = { ...user, avatar: reader.result };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        showToast("Profile image updated successfully!", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  // Change password submission
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordErrors({});

    const errors = {};
    if (!currPassword) errors.currPassword = "Current password is required";
    if (!newPassword) {
      errors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    // Success
    showToast("Password updated successfully!", "success");
    setCurrPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const getInitials = () => {
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="sales-stack">
      {/* Toast */}
      {toast && (
        <div className="sales-toast-container">
          <div className={`sales-toast ${toast.type}`}>
            {toast.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span className="sales-toast-text">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sales-title-banner blue-border">
        <p>ACCOUNT SETTINGS</p>
        <h1>My Sales Profile</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }} className="md:grid-cols-3">
        {/* Profile Card & Avatar */}
        <div className="sales-widget-card" style={{ textAlign: "center", alignItems: "center" }}>
          <h4 className="sales-chart-title" style={{ width: "100%", textAlign: "left" }}>
            Sales Officer Card
          </h4>

          {/* Avatar Upload Container */}
          <div style={{ position: "relative", margin: "20px 0" }}>
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                backgroundColor: "var(--sales-primary-gold)",
                color: "var(--sales-primary-blue)",
                fontSize: "36px",
                fontWeight: "900",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: "4px solid #fff",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
              }}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                getInitials()
              )}
            </div>

            {/* Hidden upload button */}
            <label
              htmlFor="avatar-upload"
              style={{
                position: "absolute",
                bottom: "0",
                right: "4px",
                backgroundColor: "var(--sales-primary-blue)",
                color: "#fff",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "2px solid #fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
              }}
              title="Upload photo"
            >
              <Camera size={14} />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />
            </label>
          </div>

          <h3 className="sales-table-bold" style={{ fontSize: "16px", margin: "0 0 4px 0" }}>
            {user.name}
          </h3>
          <p
            className="sales-row-badge-pill"
            style={{
              backgroundColor: "#fef3c7",
              color: "var(--sales-primary-blue)",
              display: "inline-block",
              margin: "0 0 16px 0",
              fontWeight: 800
            }}
          >
            {user.role}
          </p>

          <div
            style={{
              width: "100%",
              borderTop: "1px solid #f1f5f9",
              paddingTop: "16px",
              textAlign: "left",
              fontSize: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}
          >
            <div>
              <span style={{ color: "#94a3b8", fontWeight: 700 }}>EMAIL:</span>
              <p style={{ margin: 0, fontWeight: 800, color: "#334155" }}>{user.email}</p>
            </div>
            <div>
              <span style={{ color: "#94a3b8", fontWeight: 700 }}>EMPLOYEE ID:</span>
              <p style={{ margin: 0, fontWeight: 800, color: "#334155" }}>{user.employeeId}</p>
            </div>
            <div>
              <span style={{ color: "#94a3b8", fontWeight: 700 }}>BRANCH LOCATION:</span>
              <p style={{ margin: 0, fontWeight: 800, color: "#334155" }}>{user.branch}</p>
            </div>
          </div>
        </div>

        {/* Change Password Panel */}
        <div className="sales-widget-card md:col-span-2">
          <h4 className="sales-chart-title">
            <Key size={16} style={{ verticalAlign: "middle", marginRight: "6px" }} /> Update Account Credentials
          </h4>

          <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "10px" }}>
            <div className="sales-form-group">
              <label className="sales-form-label">Current Password *</label>
              <input
                type="password"
                placeholder="••••••••"
                value={currPassword}
                onChange={(e) => setCurrPassword(e.target.value)}
                className="sales-form-input"
              />
              {passwordErrors.currPassword && <span className="sales-form-error">{passwordErrors.currPassword}</span>}
            </div>

            <div className="sales-form-group">
              <label className="sales-form-label">New Password *</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="sales-form-input"
              />
              {passwordErrors.newPassword && <span className="sales-form-error">{passwordErrors.newPassword}</span>}
            </div>

            <div className="sales-form-group">
              <label className="sales-form-label">Confirm New Password *</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="sales-form-input"
              />
              {passwordErrors.confirmPassword && (
                <span className="sales-form-error">{passwordErrors.confirmPassword}</span>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
              <button type="submit" className="sales-btn primary">
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
