import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import logoSvg from './assets/logo.png';

const rawAPI = import.meta.env.VITE_API_URL;
const API = rawAPI && rawAPI.endsWith("/") ? rawAPI.slice(0, -1) : (rawAPI || "");

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setMessage("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("token", data.token);

        if (data.employee) {
          // Employee / Manager Login
          const employeeData = {
            fullName: data.employee.fullName,
            role: data.employee.role,
            email: email, // use logged in email as official email fallback
            employeeId: data.employee.employeeId || ("EMP-" + Math.floor(100000 + Math.random() * 900000))
          };
          localStorage.setItem("user", JSON.stringify(employeeData));

          // Start the working timer
          if (!localStorage.getItem("loginTime")) {
            localStorage.setItem("loginTime", new Date().toISOString());
          }

          setMessage("✅ Login Successful");
          navigate("/dashboard");
        }
      } else {
        setMessage(data.message || "Invalid Email or Password");
      }
    } catch (error) {
      console.log(error);
      setMessage("Server Error");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f0f4f8",
        fontFamily: "'Inter', sans-serif",
        padding: "16px",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "340px",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        {/* Top Golden Border */}
        <div style={{ height: "6px", background: "#9ca3af" }}></div>

        <div style={{ padding: "32px 24px" }}>
          {/* Logo Area */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ marginBottom: "15px", display: "flex", justifyContent: "center" }}>
              <img
                src={logoSvg}
                alt="NOBAL FINANCE Logo"
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
                <path d="M20 75 V 30 L 45 50 L 60 30 V 75" stroke="#162335" strokeWidth="8" fill="none" strokeLinejoin="round" />
                <path d="M45 75 V 50 L 80 25 V 75" fill="none" stroke="#9ca3af" strokeWidth="8" strokeLinejoin="round" />
                <path d="M72 32 L 80 25 L 88 32" fill="none" stroke="#9ca3af" strokeWidth="8" strokeLinejoin="round" />
              </svg>
            </div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "900",
                color: "#162335",
                margin: "0 0 10px 0",
                letterSpacing: "1px",
              }}
            >
              NOBAL FINANCE
            </h1>
            <div
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#9ca3af",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Finance Today, Secure Tomorrow
            </div>
          </div>

          <form onSubmit={handleLogin}>
            {/* Email Field */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  textAlign: "center",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#4a5568",
                  marginBottom: "8px",
                }}
              >
                Official Login Email
              </label>
              <input
                type="email"
                placeholder="Enter official login email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  textAlign: "center",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#4a5568",
                  marginBottom: "8px",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 40px 14px 16px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <div
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "#162335",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  {showPassword ? <CustomEyeOff size={22} color="#162335" /> : <CustomEye size={22} color="#162335" />}
                </div>
              </div>
            </div>

            {/* Forgot Password */}
            <div style={{ textAlign: "right", marginBottom: "20px" }}>
              <a
                href="#"
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#9ca3af",
                  textDecoration: "none",
                }}
              >
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                background: "#162335",
                color: "#fff",
                fontSize: "16px",
                fontWeight: "600",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "background 0.3s",
              }}
            >
              {loading ? "Please Wait..." : "Sign In"}
            </button>

            {/* Message */}
            {message && (
              <p
                style={{
                  textAlign: "center",
                  marginTop: "15px",
                  color: message.includes("✅") ? "green" : "red",
                  fontSize: "14px",
                }}
              >
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;