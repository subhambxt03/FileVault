import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("ff_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem("ff_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    localStorage.setItem("ff_token", r.data.access_token);
    setUser(r.data.user);
    applyTheme(r.data.user.theme);
    return r.data.user;
  };

  const register = async (name, email, password) => {
    const r = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("ff_token", r.data.access_token);
    setUser(r.data.user);
    applyTheme(r.data.user.theme);
    return r.data.user;
  };

  const logout = () => {
    localStorage.removeItem("ff_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function applyTheme(theme) {
  if (!theme) return;
  localStorage.setItem("ff_theme", theme);
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(resolved);
}

export const useAuth = () => useContext(AuthContext);