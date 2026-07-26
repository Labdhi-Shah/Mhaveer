import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoSvg from '../assets/logo.svg';

const API = import.meta.env.VITE_API_URL;

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

      const baseUrl = (API || "").replace(/\/+$/, "");
      const response = await fetch(`${baseUrl}/api/auth/login`, {
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
        navigate("/dashboard", { replace: true });
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
       <div style={{ height: "6px", background: "#d4af37" }}></div>

        <div style={{ padding: "40px 30px" }}>
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
                  // Fallback to SVG path if img fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              
             
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
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter email address"
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