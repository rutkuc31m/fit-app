const BASE = import.meta.env.DEV ? "/api" : (import.meta.env.VITE_API_BASE || "https://api.fit.rutkuc.com/api");
const TOKEN_KEY = "fit.token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

async function request(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  const ctrl = new AbortController();
  const timeoutMs = opts.timeoutMs ?? 15000;
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(BASE + path, { ...opts, headers, signal: ctrl.signal, cache: "no-store" });
  } catch (e) {
    if (e.name === "AbortError") throw new Error("timeout");
    throw e;
  } finally { clearTimeout(timer); }
  if (res.status === 401) {
    setToken(null);
    if (location.pathname !== "/login") location.href = "/login";
    throw new Error("unauthorized");
  }
  if (!res.ok) {
    let body = null;
    try { body = await res.json(); } catch {}
    const msg = body?.error ? (body.detail ? `${body.error}: ${body.detail}` : body.error) : `http_${res.status}`;
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  get: (p) => request(p),
  post: (p, body, opts) => request(p, { method: "POST", body: JSON.stringify(body), ...(opts || {}) }),
  put: (p, body, opts) => request(p, { method: "PUT", body: JSON.stringify(body), ...(opts || {}) }),
  del: (p, body) => request(p, body ? { method: "DELETE", body: JSON.stringify(body) } : { method: "DELETE" })
};
