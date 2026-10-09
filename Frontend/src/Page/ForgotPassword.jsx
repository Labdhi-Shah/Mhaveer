import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoSvg from "../assets/logo.png";

const rawAPI = import.meta.env.VITE_API_URL;
const API = rawAPI && rawAPI.endsWith("/") ? rawAPI.slice(0, -1) : (rawAPI || "");

function ForgotPassword() {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!employeeId || !newPassword || !confirmPassword) {
      setMessage("Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const response = await fetch(`${API}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, newPassword, confirmPassword }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "Unable to update password");
        return;
      }

      setMessage("Password updated successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      console.error(error);
      setMessage("Server Error");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f0f4f8", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "420px", background: "#fff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ height: "6px", background: "#9ca3af" }} />
        <div style={{ padding: "40px 30px" }}>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <img src={logoSvg} alt="NOBAL FINANCE Logo" style={{ width: "80px", height: "80px", objectFit: "contain" }} />
            <h1 style={{ fontSize: "24px", fontWeight: "900", color: "#162335", margin: "12px 0 10px", letterSpacing: "1px" }}>RESET PASSWORD</h1>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#9ca3af", letterSpacing: "1px", textTransform: "uppercase" }}>Employee account recovery</div>
          </div>

          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", textAlign: "center", fontSize: "14px", fontWeight: "600", color: "#4a5568", marginBottom: "8px" }}>Employee ID</label>
            <input style={{ ...inputStyle, marginBottom: "18px" }} type="text" placeholder="Enter employee ID" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />

            <label style={{ display: "block", textAlign: "center", fontSize: "14px", fontWeight: "600", color: "#4a5568", marginBottom: "8px" }}>New Password</label>
            <input style={{ ...inputStyle, marginBottom: "18px" }} type="password" placeholder="Enter new password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />

            <label style={{ display: "block", textAlign: "center", fontSize: "14px", fontWeight: "600", color: "#4a5568", marginBottom: "8px" }}>Confirm Password</label>
            <input style={{ ...inputStyle, marginBottom: "25px" }} type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />

            <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: "#162335", color: "#fff", fontSize: "16px", fontWeight: "600", border: "none", borderRadius: "8px", cursor: "pointer" }}>
              {loading ? "Please Wait..." : "Update Password"}
            </button>
            <button type="button" onClick={() => navigate("/login")} style={{ width: "100%", marginTop: "12px", padding: "12px", background: "transparent", color: "#162335", fontSize: "14px", fontWeight: "600", border: "none", cursor: "pointer" }}>
              Back to Login
            </button>
            {message && <p style={{ textAlign: "center", marginTop: "15px", color: message.includes("successfully") ? "green" : "red", fontSize: "14px" }}>{message}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
