import React, { useState } from 'react';
import axios from 'axios';
import logoSvg from '../assets/logo.svg';

// 🟢 તમારી લૉગિન API નો URL અહીં સેટ કર્યો છે
const API_URL = 'http://localhost:5000/api/auth/login';

const LoginPage = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🟢 લૉગિન બટન પર ક્લિક કરવાથી આ ફંક્શન રન થશે
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // 🟢 API માં email અને password મોકલીએ છીએ (POST Request)
      const response = await axios.post(API_URL, {
        email: formData.email,
        password: formData.password,
      });

      // 🟢 જો backend માંથી success: true આવે તો આ કૉલ થશે
      if (response.data.success) {
        // બ્રાઉઝરના localStorage માં ડેટા સેવ કરીએ છીએ
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
        }
        localStorage.setItem('userRole', response.data.role || 'admin');

        setMessage({ type: 'success', text: 'Login Successful! Redirecting...' });

        // 🟢 App.jsx ને જાણ કરીએ છીએ જેથી તે Dashboard ખોલી શકે
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(response.data.role);
          }
        }, 1000); // 1 સેકન્ડ પછી ડેશબોર્ડ પર જશે
      }
    } catch (error) {
      // 🔴 જો પાસવર્ડ કે ઈમેલ ખોટો હોય તો અહીં એરર મેસેજ બતાવશે
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Login failed. Invalid credentials.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email: resetEmail,
      });
      setMessage({ type: 'success', text: response.data.message || 'Password reset link sent to your email.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to send reset link.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <img 
            src={logoSvg} 
            alt="Mhaveer Fincap Logo" 
            style={styles.logoImage} 
          />
          <h1 style={styles.brandTitle}>MHAVEER FINCAP</h1>
          <p style={styles.brandTagline}>FINANCE TODAY, SECURE TOMORROW</p>
        </div>

        {message.text && (
          <div
            style={{
              ...styles.alert,
              backgroundColor: message.type === 'error' ? '#f8d7da' : '#d4edda',
              color: message.type === 'error' ? '#721c24' : '#155724',
            }}
          >
            {message.text}
          </div>
        )}

        {!isForgotPassword ? (
          <form onSubmit={handleLoginSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                style={styles.input}
              />
            </div>

            <div style={styles.forgotPassContainer}>
              <span
                onClick={() => {
                  setIsForgotPassword(true);
                  setMessage({ type: '', text: '' });
                }}
                style={styles.link}
              >
                Forgot Password?
              </span>
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPasswordSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Enter Registered Email</label>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="email@example.com"
                style={styles.input}
              />
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <span
                onClick={() => {
                  setIsForgotPassword(false);
                  setMessage({ type: '', text: '' });
                }}
                style={styles.link}
              >
                Back to Login
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundColor: '#f0f4f8',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    boxSizing: 'border-box',
    margin: 0,
    padding: '20px',
    overflowY: 'auto',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '35px 30px',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
    borderTop: '4px solid #C59B27',
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  logoImage: {
    width: '90px',
    height: 'auto',
    marginBottom: '10px',
  },
  brandTitle: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '800',
    color: '#0A2540',
    letterSpacing: '1px',
  },
  brandTagline: {
    margin: '4px 0 0 0',
    fontSize: '11px',
    fontWeight: '600',
    color: '#C59B27',
    letterSpacing: '1px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    color: '#4A5568',
    fontWeight: '600',
  },
  input: {
    width: '100%',
    padding: '11px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    color: '#475569',
    backgroundColor: '#FAFAFA',
  },
  forgotPassContainer: {
    textAlign: 'right',
    marginBottom: '20px',
  },
  link: {
    color: '#0A2540',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'none',
  },
  button: {
    padding: '12px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#0A2540',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  alert: {
    padding: '10px 12px',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '13px',
    textAlign: 'center',
  },
};

export default LoginPage;