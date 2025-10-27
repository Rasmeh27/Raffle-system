// src/pages/admin/LoginAdmin.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin, setAdminToken } from "../../service/admin";

export default function LoginAdmin() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const auth = await adminLogin(form.username, form.password);
      setAdminToken(auth.access_token);
      nav("/admin", { replace: true });
    } catch (e: any) {
      const msg = e?.response?.data?.detail || "Credenciales incorrectas.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold">Acceso Administrador</h1>
      <p className="mt-1 text-sm text-gray-600">Ingresa con tu usuario y contraseña.</p>

      {err && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Usuario</span>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="admin"
            autoComplete="username"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Contraseña</span>
          <input
            type="password"
            className="w-full rounded-lg border px-3 py-2"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>
    </div>
  );
}
