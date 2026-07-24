import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard'; // 🟢 તમારું Admin Dashboard

function App() {
  // 🟢 જો બ્રાઉઝરમાં અગાઉથી લોગિન સેવ હોય તો સીધું Dashboard ખોલશે
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('userRole')
  );

  // 🟢 Login સફળ થાય ત્યારે આ ફંક્શન રન થઈને Admin Dashboard બતાવશે
  const handleLoginSuccess = (role) => {
    setIsLoggedIn(true);
  };

  // 🟢 Logout બટન પર ક્લિક કરવાથી લૉગિન સ્ક્રીન પાછી આવશે
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
  };

  return (
    <div>
      {/* 🟢 જો Logged in હોય તો AdminDashboard બતાવશે, નહીંતર LoginPage */}
      {isLoggedIn ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;