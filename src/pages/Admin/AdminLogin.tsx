// src/pages/admin/LoginAdmin.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin, setAdminToken } from "../../service/admin";
import {
  Eye,
  EyeOff,
  Loader2,
  Shield,
  AlertCircle,
  LockKeyhole,
  User2,
} from "lucide-react";

export default function LoginAdmin() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const userRef = useRef<HTMLInputElement>(null);

  // Enfocar el primer campo al montar
  useEffect(() => {
    userRef.current?.focus();
  }, []);

  const canSubmit = useMemo(
    () => form.username.trim().length > 0 && form.password.length > 0 && !loading,
    [form, loading]
  );

  function handleCaps(e: React.KeyboardEvent<HTMLInputElement>) {
    // Algunos navegadores reportan correctamente CapsLock
    setCapsOn(e.getModifierState && e.getModifierState("CapsLock"));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setErr(null);
    setLoading(true);
    try {
      const auth = await adminLogin(form.username.trim(), form.password);
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      {/* Decoración sutil */}
      <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(60rem_60rem_at_120%_-10%,#22d3ee15,transparent_60%),radial-gradient(40rem_40rem_at_-20%_120%,#a78bfa20,transparent_60%)]" />

      <div className="relative w-full max-w-md">
        {/* Marca / Header */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur">
            <Shield aria-hidden className="h-5 w-5 text-cyan-300" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Panel Admin — Sistema de Rifas
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Acceso seguro para administradores
            </p>
          </div>
        </div>

        {/* Tarjeta */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          {/* Mensaje de error */}
          {err && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-red-200"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="text-sm">{err}</div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Usuario */}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-200">
                Usuario
              </span>
              <div className="group relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User2 className="h-4 w-4" />
                </span>
                <input
                  ref={userRef}
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-9 py-2.5 text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-400/50 focus:bg-white/15"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="admin"
                  autoComplete="username"
                  inputMode="text"
                  aria-invalid={!!err}
                />
              </div>
            </label>

            {/* Contraseña */}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-200">
                Contraseña
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LockKeyhole className="h-4 w-4" />
                </span>
                <input
                  type={showPwd ? "text" : "password"}
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-9 py-2.5 pr-11 text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-400/50 focus:bg-white/15"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onKeyUp={handleCaps}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!err}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-300 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                  aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {capsOn && (
                <p className="mt-2 text-xs text-amber-300">
                  Bloq Mayús activado — puede causar errores al escribir la contraseña.
                </p>
              )}
            </label>

            {/* Opciones */}
            <div className="flex items-center justify-between">
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-400/40"
                  // Implementa "Recordarme" si lo deseas más adelante
                  onChange={() => {}}
                />
                <span className="text-sm text-slate-300">Recordarme</span>
              </label>
              <button
                type="button"
                className="text-sm text-cyan-300 underline-offset-4 hover:underline"
                onClick={() => alert("Contacta al soporte para restablecer la contraseña.")}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Botón enviar */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 outline-none transition enabled:hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ingresando…
                </>
              ) : (
                <>
                  Iniciar sesión
                </>
              )}
            </button>

            {/* Nota de seguridad / 2FA futura */}
            <p className="text-center text-xs text-slate-400">
              Consejo: habilita 2FA para mayor seguridad cuando esté disponible.
            </p>
          </form>
        </div>

        {/* Footer pequeño */}
        <p className="mt-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Sistema de Rifas. Panel de Administración.
        </p>
      </div>
    </div>
  );
}
