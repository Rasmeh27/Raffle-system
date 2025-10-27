// src/pages/admin/AdminPanel.tsx
import { Link, useNavigate } from "react-router-dom";
import { clearAdminToken } from "../../service/admin";
import {
  LayoutDashboard,
  TicketPercent,
  Package,
  Users,
  ArrowRight,
  LogOut,
  ShieldCheck,
  Wand2,
} from "lucide-react";

export default function AdminPanel() {
  const nav = useNavigate();

  function logout() {
    clearAdminToken();
    nav("/admin/login");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <section className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        {/* Encabezado */}
        <header className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-600 text-white shadow-sm">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Panel de Administración
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Gestiona rifas, productos y participantes con confianza.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 md:inline">
              Sesión verificada
            </span>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ActionCard
            icon={<TicketPercent className="h-5 w-5" />}
            title="Rifas"
            desc="Crear y gestionar rifas."
            to="/admin/rifas"
            accent="from-indigo-600/15 to-indigo-400/10"
          />
          <ActionCard
            icon={<Package className="h-5 w-5" />}
            title="Productos"
            desc="CRUD de productos e imágenes."
            to="/admin/productos"
            accent="from-emerald-600/15 to-emerald-400/10"
          />
          <ActionCard
            icon={<Users className="h-5 w-5" />}
            title="Participantes"
            desc="Estados, validación y exportación."
            to="/admin/participantes"
            accent="from-amber-600/15 to-amber-400/10"
          />
        </div>

        {/* Bloque de “Confianza & Controles” */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InfoCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Pagos verificados"
            desc="Estandariza métodos y reduce errores de revisión."
          />
          <InfoCard
            icon={<Wand2 className="h-5 w-5" />}
            title="Flujos optimizados"
            desc="Accesos rápidos a tareas frecuentes del día a día."
          />
          <InfoCard
            icon={<ArrowRight className="h-5 w-5" />}
            title="Próximos pasos"
            desc="Crea una rifa o carga productos para comenzar."
          />
        </div>
      </section>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  desc,
  to,
  accent = "from-slate-600/10 to-slate-400/10",
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  to: string;
  accent?: string;
}) {
  return (
    <Link
      to={to}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}`} />
      <div className="relative p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/70 ring-1 ring-slate-200 backdrop-blur">
              <span className="text-slate-800">{icon}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600">{desc}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

function InfoCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-200">
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <p className="mt-1 text-sm text-slate-600">{desc}</p>
        </div>
      </div>
    </div>
  );
}
