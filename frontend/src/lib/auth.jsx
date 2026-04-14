import { createContext, useContext, useEffect, useState } from "react";
import { api, setToken, getToken } from "./api";
import { setLang } from "../i18n";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    api.get("/auth/me")
      .then((u) => { setUser(u); if (u?.lang) setLang(u.lang); })
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { user, token } = await api.post("/auth/login", { email, password });
    setToken(token); setUser(user); if (user.lang) setLang(user.lang);
  };
  const register = async (email, password, name, lang) => {
    const { user, token } = await api.post("/auth/register", { email, password, name, lang });
    setToken(token); setUser(user); setLang(lang);
  };
  const logout = () => { setToken(null); setUser(null); location.href = "/login"; };
  const refresh = async () => setUser(await api.get("/auth/me"));

  return <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
