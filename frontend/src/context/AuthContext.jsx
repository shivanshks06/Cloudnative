import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("cloudnative_token");
    if (!token) {
      setLoading(false);
      return;
    }

    api.get("/auth/me")
      .then(({ data }) => setUser(data.data.user))
      .catch(() => {
        localStorage.removeItem("cloudnative_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(emailOrUsername, password) {
    const { data } = await api.post("/auth/login", {
      identifier: emailOrUsername,
      email: emailOrUsername,
      password
    });
    localStorage.setItem("cloudnative_token", data.data.token);
    setUser(data.data.user);
    return data.data.user;
  }

  async function register(name, email, password, username, role = "DEVELOPER") {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
      username,
      role
    });
    localStorage.setItem("cloudnative_token", data.data.token);
    setUser(data.data.user);
    return data.data.user;
  }

  function logout() {
    localStorage.removeItem("cloudnative_token");
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}
