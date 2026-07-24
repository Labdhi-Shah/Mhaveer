import React, { useState } from 'react';
import axios from 'axios';
import logoSvg from '../assets/logo.svg';


const ROLES = [
  'Super Admin',
  'Admin',
  'Branch Manager',
  'RM',
  'Sales Executive',
  'Credit Manager',
  'Documentation Executive',
  'Accountant',
  'Viewer',
];

const LoginPage = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'Viewer',
  });

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, formData);

      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userRole', response.data.role);
        localStorage.setItem('loginTime', new Date().getTime());

        setMessage({ type: 'success', text: 'Login Successful! Redirecting...' });

        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Login failed. Please check your credentials.',
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
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
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
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#f0f4f8',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    boxSizing: 'border-box',
    padding: '40px 20px', // 🟢 ઉપર-નીચે 40px ની સ્પેસ આપી જેથી કાર્ડ કટ ન થાય
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '35px 30px',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
    borderTop: '4px solid #C59B27', // 🟢 ઉપરની ગોલ્ડ લાઈન કટ વગર પ્રોપર દેખાશે
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
  formTitle: {
    textAlign: 'center',
    margin: '15px 0 20px 0',
    fontSize: '16px',
    color: '#666666',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
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
  select: {
    width: '100%',
    padding: '11px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    fontSize: '14px',
    backgroundColor: '#FAFAFA',
    color: '#475569',
    boxSizing: 'border-box',
    cursor: 'pointer',
    outline: 'none',
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