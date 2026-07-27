import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoSvg from '../assets/logo.svg';

const rawAPI = import.meta.env.VITE_API_URL || "https://mhaveer.onrender.com";
const API = rawAPI.endsWith("/") ? rawAPI.slice(0, -1) : rawAPI;

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          // Employee Login
          const employeeData = {
            fullName: data.employee.fullName,
            role: data.employee.role,
            email: email, // use logged in email as official email fallback
            employeeId: "EMP-" + Math.floor(100000 + Math.random() * 900000) // unique mock ID
          };
          localStorage.setItem("user", JSON.stringify(employeeData));
          
          // Start the working timer
          if (!localStorage.getItem("loginTime")) {
            localStorage.setItem("loginTime", new Date().toISOString());
          }
          
          setMessage("✅ Login Successful");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1000);
        } else {
          // Super Admin Login
          localStorage.setItem("user", JSON.stringify({ email, name: "Super Admin", role: "SuperAdmin" }));
          setMessage("✅ Login Successful");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1000);
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
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        {/* Top Golden Border */}
        <div style={{ height: "6px", background: "#d4af37" }}></div>

        <div style={{ padding: "40px 30px" }}>
          {/* Logo Area */}
          <div style={{ textAlign: "center", marginBottom: "35px" }}>
            <div style={{ marginBottom: "15px", display: "flex", justifyContent: "center" }}>
              <img
                src={logoSvg}
                alt="Mhaveer Fincap Logo"
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
                <path d="M20 75 V 30 L 45 50 L 60 30 V 75" stroke="#0b2746" strokeWidth="8" fill="none" strokeLinejoin="round" />
                <path d="M45 75 V 50 L 80 25 V 75" fill="none" stroke="#d4af37" strokeWidth="8" strokeLinejoin="round" />
                <path d="M72 32 L 80 25 L 88 32" fill="none" stroke="#d4af37" strokeWidth="8" strokeLinejoin="round" />
              </svg>
            </div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "900",
                color: "#0b2746",
                margin: "0 0 10px 0",
                letterSpacing: "1px",
              }}
            >
              MHAVEER FINCAP
            </h1>
            <div
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#d4af37",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Finance Today, Secure Tomorrow
            </div>
          </div>

          <form onSubmit={handleLogin}>
            {/* Email Field */}
            <div style={{ marginBottom: "20px" }}>
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
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {/* Forgot Password */}
            <div style={{ textAlign: "right", marginBottom: "25px" }}>
              <a
                href="#"
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#d4af37",
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
                background: "#0b2746",
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