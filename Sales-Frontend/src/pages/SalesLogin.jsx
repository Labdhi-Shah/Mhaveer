import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import logoSvg from "../assets/logo.svg";
import "../components/SalesDepartment.css";

export default function SalesLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation error states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState(""); // "success" or "error"
  const [loading, setLoading] = useState(false);

  const validateEmail = (val) => {
    if (!val) {
      return "Email is required";
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(val)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setStatusMessage("");

    const mailErr = validateEmail(email);
    const passErr = !password ? "Password is required" : "";

    if (mailErr || passErr) {
      setEmailError(mailErr);
      setPasswordError(passErr);
      return;
    }

    setLoading(true);
    setStatusMessage("Signing in...");
    setStatusType("success");

    // Simulate API delay
    setTimeout(() => {
      // Store mock user token and info
      localStorage.setItem("sales_token", "mock-sales-jwt-token-12345");
      localStorage.setItem(
        "sales_user",
        JSON.stringify({
          name: "Sales Officer",
          email: email,
          role: "Sales Representative",
          employeeId: "SLS-40291",
          branch: "Corporate Gujarat"
        })
      );
      
      setStatusMessage("✅ Login Successful! Redirecting...");
      setStatusType("success");
      
      setTimeout(() => {
        setLoading(false);
        navigate("/dashboard", { replace: true });
      }, 800);
    }, 1000);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setStatusMessage("Password reset instructions sent to your email (Demo only)");
    setStatusType("success");
    setTimeout(() => setStatusMessage(""), 4000);
  };

  return (
    <div className="sales-login-container">
      <div className="sales-login-card">
        <div className="sales-login-accent-bar"></div>
        <div className="sales-login-body">
          {/* Logo Area */}
          <div className="sales-login-logo-area">
            <div className="sales-login-logo-wrap">
              <img
                src={logoSvg}
                alt="Mhaveer Fincap Logo"
                className="sales-login-logo-img"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
            <h1 className="sales-login-title">MHAVEER FINCAP</h1>
            <p className="sales-login-subtitle">Sales Portal Login</p>
          </div>

          <form onSubmit={handleLogin} noValidate>
            {/* Email Field */}
            <div className="sales-login-form-group">
              <label className="sales-login-form-label">Sales Login Email</label>
              <input
                type="email"
                placeholder="Enter sales login email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="sales-login-input"
                disabled={loading}
              />
              {emailError && <span className="sales-form-error">{emailError}</span>}
            </div>

            {/* Password Field */}
            <div className="sales-login-form-group">
              <label className="sales-login-form-label">Password</label>
              <div className="sales-login-input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="sales-login-input"
                  disabled={loading}
                  style={{ paddingRight: "45px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="sales-login-password-toggle"
                  title={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && <span className="sales-form-error">{passwordError}</span>}
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="sales-login-options-row">
              <label className="sales-login-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sales-login-checkbox"
                  disabled={loading}
                />
                Remember Me
              </label>
              <a
                href="#forgot-password"
                onClick={handleForgotPassword}
                className="sales-login-forgot-link"
              >
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="sales-login-btn"
              disabled={loading}
            >
              {loading ? "Please Wait..." : "Sign In"}
            </button>

            {/* Status Message Display */}
            {statusMessage && (
              <div
                className={`sales-login-msg ${statusType}`}
                style={{
                  color: statusType === "success" ? (statusMessage.startsWith("✅") ? "green" : "#0a2540") : "red",
                  textAlign: "center",
                  marginTop: "15px",
                  fontSize: "13px",
                  fontWeight: "bold"
                }}
              >
                {statusMessage}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
