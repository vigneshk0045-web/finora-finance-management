import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = async () => {
    const token = localStorage.getItem("finora_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/api/auth/me");
      setUser(data.user);
    } catch {
      localStorage.removeItem("finora_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMe(); }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("finora_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/api/auth/register", payload);
    localStorage.setItem("finora_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("finora_token");
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout, refreshUser: loadMe, setUser }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
