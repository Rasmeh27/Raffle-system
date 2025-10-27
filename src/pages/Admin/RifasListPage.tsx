// src/pages/admin/RifasListPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listarRifas, eliminarRifa } from "../../service/rifas";
import type { Rifa } from "../../utils/types";
import { money } from "../../utils/fmt";
import {
  Plus,
  Filter,
  Users,
  ExternalLink,
  Pencil,
  Trash2,
  Hash,
  Ticket,
  DollarSign,
} from "lucide-react";

/* ========= UI pills ========= */
function EstadoPill({ estado }: { estado: Rifa["estado"] }) {
  const base =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1";
  const map: Record<Rifa["estado"], string> = {
    CREADA: "bg-slate-50 text-slate-700 ring-slate-200",
    ABIERTA: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    PAUSADA: "bg-amber-50 text-amber-800 ring-amber-200",
    CERRADA: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return <span className={`${base} ${map[estado]}`}>{estado}</span>;
}

export default function RifasListPage() {
  const nav = useNavigate();
  const [list, setList] = useState<Rifa[]>([]);
  const [loading, setLoading] = useState(false);
  const [estado, setEstado] = useState<"" | Rifa["estado"]>("");
  const [q, setQ] = useState(""); // búsqueda local por título

  async function load() {
    setLoading(true);
    try {
      const data = await listarRifas(estado ? { estado } : undefined);
      setList(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  const filtered = useMemo(() => {
    if (!q.trim()) return list;
    const t = q.trim().toLowerCase();
    return list.filter((r) => r.titulo.toLowerCase().includes(t));
  }, [list, q]);

  const kpis = useMemo(() => {
    const total = list.length;
    const abiertas = list.filter((r) => r.estado === "ABIERTA").length;
    const pausadas = list.filter((r) => r.estado === "PAUSADA").length;
    const cerradas = list.filter((r) => r.estado === "CERRADA").length;
    return { total, abiertas, pausadas, cerradas };
  }, [list]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-600 text-white shadow-sm">
              <Ticket size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Rifas</h1>
              <p className="mt-1 text-sm text-slate-600">
                Gestiona tus rifas, revisa estados y accede a acciones rápidas.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1 shadow-sm">
              <Filter size={16} className="text-slate-500" />
              <select
                className="rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                value={estado}
                onChange={(e) => setEstado((e.target.value as any) || "")}
              >
                <option value="">Todos los estados</option>
                <option value="ABIERTA">ABIERTA</option>
                <option value="CREADA">CREADA</option>
                <option value="PAUSADA">PAUSADA</option>
                <option value="CERRADA">CERRADA</option>
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por título…"
                className="w-44 text-sm focus:outline-none"
              />
            </div>

            <button
              onClick={() => nav("/admin/rifas/crear")}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black"
            >
              <Plus size={16} />
              Crear rifa
            </button>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi title="Total" value={kpis.total} accent="from-slate-800/10 to-slate-600/10" icon={<Hash className="h-4 w-4" />} />
          <Kpi title="Abiertas" value={kpis.abiertas} accent="from-emerald-600/10 to-emerald-400/10" icon={<Users className="h-4 w-4" />} />
          <Kpi title="Pausadas" value={kpis.pausadas} accent="from-amber-600/10 to-amber-400/10" icon={<Filter className="h-4 w-4" />} />
          <Kpi title="Cerradas" value={kpis.cerradas} accent="from-rose-600/10 to-rose-400/10" icon={<Trash2 className="h-4 w-4" />} />
        </div>

        {/* Grid de rifas */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-600">
              {list.length === 0 ? "Aún no hay rifas." : "No hay resultados para tu búsqueda/estado."}
            </p>
            <button
              onClick={() => nav("/admin/rifas/crear")}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black"
            >
              <Plus size={16} />
              Crear la primera rifa
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Franja superior */}
                <div className="h-1 w-full bg-gradient-to-r from-slate-900 to-slate-600" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-slate-900">{r.titulo}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Rango{" "}
                        <span className="font-semibold text-slate-800">
                          {r.rango_min}–{r.rango_max}
                        </span>
                      </p>
                      <div className="mt-1 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                        <DollarSign className="h-3.5 w-3.5" />
                        Precio: {money(r.precio_numero)}
                      </div>
                    </div>
                    <EstadoPill estado={r.estado} />
                  </div>

                  {/* Acciones */}
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-start">
                    <ActionBtn to={`/admin/rifas/${r.id}`} icon={<Users className="h-3.5 w-3.5" />}>
                      Participantes
                    </ActionBtn>
                    <ActionBtn to={`/rifa/${r.id}`} icon={<ExternalLink className="h-3.5 w-3.5" />}>
                      Vista pública
                    </ActionBtn>
                    <ActionBtn onClick={() => nav(`/admin/rifas/${r.id}/editar`)} icon={<Pencil className="h-3.5 w-3.5" />}>
                      Editar
                    </ActionBtn>
                    <ActionBtn
                      tone="danger"
                      onClick={async () => {
                        if (!confirm("¿Eliminar rifa? Se borrarán participantes y tickets asociados.")) return;
                        await eliminarRifa(r.id);
                        await load();
                      }}
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                    >
                      Eliminar
                    </ActionBtn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ========= UI helpers ========= */

function Kpi({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className={`h-1 w-full bg-gradient-to-r ${accent}`} />
      <div className="flex items-start justify-between p-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-200">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({
  to,
  onClick,
  children,
  icon,
  tone = "default",
}: {
  to?: string;
  onClick?: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm ring-1 transition";
  const tones: Record<string, string> = {
    default: "bg-white text-slate-700 hover:bg-slate-50 ring-slate-200",
    danger: "bg-rose-600 text-white hover:bg-rose-700 ring-rose-600/10",
  };

  if (to) {
    return (
      <Link to={to} className={`${base} ${tones[tone]}`}>
        {icon}
        {children}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={`${base} ${tones[tone]}`}>
      {icon}
      {children}
    </button>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-slate-200 to-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/5 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="h-6 w-24 animate-pulse rounded bg-slate-100" />
        <div className="mt-2 grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-full animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
