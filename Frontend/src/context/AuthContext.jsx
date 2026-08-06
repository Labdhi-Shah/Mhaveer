import { createContext, useContext, useState } from "react";
import api from "../api";

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

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data.success) {
        const token = res.data.token;
        const userData = res.data.employee || { email, name: "Super Admin", role: "SuperAdmin" };
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", token);
        setUser(userData);
        return { success: true };
      }

      return { success: false, message: res.data.message || "Invalid credentials." };

    } catch (err) {

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
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );

};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);