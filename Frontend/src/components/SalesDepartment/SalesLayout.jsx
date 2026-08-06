import React, { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  LayoutDashboard,
  Users,
  FolderHeart,
  Clock,
  Calendar,
  Layers,
  FileBarChart,
  User,
  Settings as SettingsIcon,
  LogOut,
  X
} from "lucide-react";
import logoSvg from "../../assets/logo.svg";
import "./SalesDepartment.css";

export default function SalesLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState({
    name: "Sales Officer",
    email: "sales@mhaveerfincap.com",
    role: "Sales Representative",
    employeeId: "SLS-40291",
    branch: "Corporate Gujarat"
  });

  // Load user details from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("sales_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Handle click outside of profile dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get active page title for header view
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.endsWith("/dashboard")) return "Sales Department Dashboard";
    if (path.endsWith("/leads")) return "Sales Leads Management";
    if (path.endsWith("/customers")) return "Valued Customers Directory";
    if (path.endsWith("/follow-up")) return "Call Back Follow-ups";
    if (path.endsWith("/meetings")) return "Scheduled Meetings Log";
    if (path.endsWith("/pipeline")) return "Interactive Sales Pipeline";
    if (path.endsWith("/reports")) return "Performance Reports & Analytics";
    if (path.endsWith("/profile")) return "Sales Representative Profile";
    if (path.endsWith("/settings")) return "Portal Preferences & Settings";
    return "Sales Portal";
  };

  const handleLogout = () => {
    localStorage.removeItem("sales_token");
    localStorage.removeItem("sales_user");
    navigate("/sales/login", { replace: true });
  };

  // Get user initials for avatar
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const menuItems = [
    { label: "Dashboard", path: "/sales/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Leads", path: "/sales/leads", icon: <Users size={18} /> },
    { label: "Customers", path: "/sales/customers", icon: <FolderHeart size={18} /> },
    { label: "Follow Up", path: "/sales/follow-up", icon: <Clock size={18} /> },
    { label: "Meetings", path: "/sales/meetings", icon: <Calendar size={18} /> },
    { label: "Sales Pipeline", path: "/sales/pipeline", icon: <Layers size={18} /> },
    { label: "Reports", path: "/sales/reports", icon: <FileBarChart size={18} /> },
    { label: "Profile", path: "/sales/profile", icon: <User size={18} /> },
    { label: "Settings", path: "/sales/settings", icon: <SettingsIcon size={18} /> }
  ];

  return (
    <div className="sales-portal">
      {/* Top Navbar */}
      <header className="sales-header">
        <div className="sales-header-left">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="sales-hamburger"
            title="Toggle Sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="sales-logo-box">
            <img src={logoSvg} alt="Mhaveer Logo" className="sales-logo-img" />
          </div>

          <div className="sales-brand-name">
            MHAVEER <span className="sales-brand-gold">FINCAP</span>
          </div>

          <div className="sales-header-divider"></div>
          <span className="sales-page-title">{getPageTitle()}</span>
        </div>

        <div className="sales-header-right">
          {/* Header Search Bar (Desktop only) */}
          <div className="sales-search-bar">
            <Search className="sales-search-icon" size={15} />
            <input
              type="text"
              placeholder="Search leads, clients, deals..."
              className="sales-search-input"
            />
          </div>

          {/* Notification Button */}
          <button className="sales-nav-icon-btn" title="Notifications">
            <Bell size={18} />
            <span className="sales-badge-dot" />
          </button>

          <div style={{ width: "1px", height: "1.5rem", backgroundColor: "#334155" }}></div>

          {/* Profile Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="sales-profile-trigger"
            >
              <div className="sales-avatar-circle">{initials}</div>
              <ChevronDown
                size={14}
                className={`sales-profile-chevron ${dropdownOpen ? "open" : ""}`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {dropdownOpen && (
              <div className="sales-profile-dropdown">
                <div className="sales-dropdown-header">
                  <p className="sales-dropdown-name">{user.name}</p>
                  <p className="sales-dropdown-role">
                    Role: <span>{user.role}</span>
                  </p>
                  <p className="sales-dropdown-details">ID: {user.employeeId}</p>
                  <p className="sales-dropdown-details">{user.email}</p>
                  <p className="sales-dropdown-role" style={{ fontSize: "8px", marginTop: "4px" }}>
                    Branch: {user.branch}
                  </p>
                </div>
                <div className="sales-dropdown-menu">
                  <button
                    onClick={() => {
                      navigate("/sales/profile");
                      setDropdownOpen(false);
                    }}
                    className="sales-dropdown-item"
                  >
                    <User size={14} /> My Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate("/sales/settings");
                      setDropdownOpen(false);
                    }}
                    className="sales-dropdown-item"
                  >
                    <SettingsIcon size={14} /> Portal Settings
                  </button>
                  <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "4px 0" }}></div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setDropdownOpen(false);
                    }}
                    className="sales-dropdown-item logout"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Backdrop overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="sales-backdrop" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`sales-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div>
          <p className="sales-sidebar-portal-label">Sales Department</p>
          <div className="sales-sidebar-menu">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`sales-sidebar-btn ${isActive ? "active" : ""}`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ height: "1px", backgroundColor: "#e2e8f0", margin: "10px 0" }}></div>
          <button
            onClick={handleLogout}
            className="sales-sidebar-btn"
            style={{ color: "#e11d48" }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="sales-main">
        <Outlet />
      </main>
    </div>
  );
}
