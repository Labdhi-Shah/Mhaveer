import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (email, password) => {
    if (email === "admin@example.com" && password === "123456") {
      const userData = { email, name: "Super Admin", role: "Admin" };
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", "mock-jwt-token-123456");
      setUser(userData);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);