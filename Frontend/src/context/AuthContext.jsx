import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";
import socket, { authenticateSocket } from "../utils/socket";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error(e);
        return null;
      }
    }
    return null;
  });

  // Keep socket authentication synchronized with current user
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem("token");
      authenticateSocket(user, token);
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data.success) {
        const token = res.data.token;
        const userData = res.data.employee;
        if (!userData) {
          return { success: false, message: "Invalid user data." };
        }
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", token);
        setUser(userData);
        authenticateSocket(userData, token);
        return { success: true };
      }
      return { success: false, message: res.data.message || "Invalid credentials." };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        message: err.response?.data?.message || "Server error during login",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    try {
      socket.disconnect();
    } catch (e) {
      console.warn("Socket disconnect on logout:", e.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);