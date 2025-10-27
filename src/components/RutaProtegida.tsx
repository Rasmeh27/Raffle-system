// src/components/RutaProtegida.tsx
import { Navigate } from "react-router-dom";
import { getAdminToken } from "../service/admin";

export default function RutaProtegida({ children }: { children: React.ReactNode }) {
  const token = getAdminToken();
  if (!token) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
