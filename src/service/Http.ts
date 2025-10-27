import axios from "axios";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) ?? "http://localhost:8000";

export const http = axios.create({
  baseURL: API_BASE_URL,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
