import axios from "axios";

function normalizeBaseUrl(raw) {
  const fallback = "http://localhost:5000";
  if (!raw || typeof raw !== "string") return fallback;
  let value = raw.trim().replace(/\/+$/, "");
  if (value.endsWith("/api")) value = value.slice(0, -4);
  return value || fallback;
}

const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_URL),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("finora_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
