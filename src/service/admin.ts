// src/service/admin.ts
import { http } from "./Http";
import type { AdminAuth } from "../utils/types";

export async function adminLogin(username: string, password: string) {
  const body = new URLSearchParams();
  body.set("username", username);
  body.set("password", password);
  body.set("grant_type", "password");
  const { data } = await http.post("/admin/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data as AdminAuth;
}

export function setAdminToken(token: string) {
  localStorage.setItem("admin_token", token);
}
export function getAdminToken() {
  return localStorage.getItem("admin_token");
}
export function clearAdminToken() {
  localStorage.removeItem("admin_token");
}
