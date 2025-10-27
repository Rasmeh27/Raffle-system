// src/pages/admin/ParticipantesPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  adminListParticipantes,
  adminActualizarEstadoParticipante,
  adminEliminarParticipante,
  adminGetParticipante,
} from "../../service/participantes.admin";
import type { Participante } from "../../utils/types";
import { b64ToBlobUrl } from "../../utils/b64";
import { downloadBlobFromGet } from "../../utils/downloads";
import {
  Filter,
  RefreshCw,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Phone,
  Mail,
  Hash,
  User,
  Image as ImageIcon,
  Ticket,
  BadgeCheck,
  Search,
} from "lucide-react";

export default function ParticipantesPage() {
  const [list, setList] = useState<Participante[]>([]);
  const [rifaId, setRifaId] = useState<number | "">("");
  const [estado, setEstado] = useState<string>("");
  const [selected, setSelected] = useState<Participante | null>(null);
  const [loading, setLoading] = useState(false);

  const estados = useMemo(() => ["pendiente", "aprobado", "rechazado"], []);

  async function load() {
    setLoading(true);
    try {
      const params: any = {};
      if (rifaId !== "") params.rifa_id = rifaId;
      if (estado) params.estado = estado;
      const data = await adminListParticipantes(params);
      setList(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cambiarEstado(p: Participante, nuevo: string) {
    await adminActualizarEstadoParticipante(p.id, nuevo);
    await load();
  }

  async function verDetalle(p: Participante) {
    const full = await adminGetParticipante(p.id);
    setSelected(full);
  }

  async function eliminar(p: Participante) {
    if (!confirm("¿Eliminar participante?")) return;
    await adminEliminarParticipante(p.id);
    await load();
  }

  async function exportarExcel() {
    await downloadBlobFromGet(
      `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/participantes/exportar_excel`,
      "participantes.xlsx"
    );
  }

  // KPIs simples
  const kpis = useMemo(() => {
    const total = list.length;
    const pend = list.filter((p) => (p.estado || "").toLowerCase() === "pendiente").length;
    const apro = list.filter((p) => (p.estado || "").toLowerCase() === "aprobado").length;
    const rech = list.filter((p) => (p.estado || "").toLowerCase() === "rechazado").length;
    return { total, pend, apro, rech };
  }, [list]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-600 text-white shadow-sm">
              <BadgeCheck size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Participantes
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Revisa comprobantes, actualiza estados y exporta el listado.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportarExcel}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Download size={16} />
              Exportar Excel
            </button>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Recargar
            </button>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi title="Total" value={kpis.total} accent="from-slate-800/10 to-slate-600/10" icon={<Hash className="h-4 w-4" />} />
          <Kpi title="Pendientes" value={kpis.pend} accent="from-amber-600/10 to-amber-400/10" icon={<Clock className="h-4 w-4" />} />
          <Kpi title="Aprobados" value={kpis.apro} accent="from-emerald-600/10 to-emerald-400/10" icon={<CheckCircle2 className="h-4 w-4" />} />
          <Kpi title="Rechazados" value={kpis.rech} accent="from-rose-600/10 to-rose-400/10" icon={<XCircle className="h-4 w-4" />} />
        </div>

        {/* Filtros */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <Filter size={16} />
              <span className="text-sm font-semibold">Filtros</span>
            </div>

            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Rifa ID"
                  className="w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  value={rifaId}
                  onChange={(e) => setRifaId(e.target.value ? Number(e.target.value) : "")}
                />

                <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1 shadow-sm md:flex">
                  <Search size={16} className="text-slate-500" />
                  <span className="text-xs text-slate-500">Filtra por Rifa</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Chip active={estado === ""} onClick={() => setEstado("")} label="Todos" />
                {estados.map((s) => (
                  <Chip key={s} active={estado === s} onClick={() => setEstado(s)} label={capitalize(s)} />
                ))}
              </div>

              <button
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black"
                onClick={load}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="text-slate-600">
                  <Th>ID</Th>
                  <Th>Nombre</Th>
                  <Th>Referencia</Th>
                  <Th>Teléfono</Th>
                  <Th>Email</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>

              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                  : list.map((p) => (
                      <tr key={p.id} className="border-t border-slate-100">
                        <Td>
                          <span className="inline-flex items-center gap-1">
                            <Hash className="h-3.5 w-3.5 text-slate-400" /> {p.id}
                          </span>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-slate-700 ring-1 ring-slate-200">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="min-w-[12ch]">
                              <div className="font-medium text-slate-900">
                                {p.nombre} {p.apellido}
                              </div>
                              <div className="text-xs text-slate-500">Rifa #{p.rifa_id ?? "—"}</div>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <span className="inline-flex items-center gap-1 text-slate-800">
                            <Ticket className="h-3.5 w-3.5 text-slate-400" />
                            {p.numero_referencia || "—"}
                          </span>
                        </Td>
                        <Td>
                          <span className="inline-flex items-center gap-1 text-slate-800">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            {p.numero_telefono}
                          </span>
                        </Td>
                        <Td>
                          <span className="inline-flex items-center gap-1 text-slate-800">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            {p.email || "—"}
                          </span>
                        </Td>
                        <Td>
                          <StatusPill status={p.estado} />
                        </Td>
                        <Td className="text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <ActionBtn onClick={() => verDetalle(p)} icon={<Eye className="h-3.5 w-3.5" />}>
                              Ver
                            </ActionBtn>
                            <ActionBtn
                              onClick={() => cambiarEstado(p, "aprobado")}
                              tone="success"
                              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                            >
                              Aprobar
                            </ActionBtn>
                            <ActionBtn
                              onClick={() => cambiarEstado(p, "pendiente")}
                              tone="warning"
                              icon={<Clock className="h-3.5 w-3.5" />}
                            >
                              Pendiente
                            </ActionBtn>
                            <ActionBtn
                              onClick={() => cambiarEstado(p, "rechazado")}
                              tone="danger"
                              icon={<XCircle className="h-3.5 w-3.5" />}
                            >
                              Rechazar
                            </ActionBtn>
                            <ActionBtn
                              onClick={() => eliminar(p)}
                              tone="muted"
                              icon={<Trash2 className="h-3.5 w-3.5" />}
                            >
                              Eliminar
                            </ActionBtn>
                          </div>
                        </Td>
                      </tr>
                    ))}

                {!list.length && !loading && (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                      No hay resultados con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Detalle */}
        {selected && (
          <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur">
              <div className="grid grid-cols-1 gap-0 md:grid-cols-5">
                {/* Lado izquierdo: datos */}
                <div className="col-span-3 p-5">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Participante #{selected.id}
                    </h2>
                    <button
                      onClick={() => setSelected(null)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoRow label="Nombre" value={`${selected.nombre} ${selected.apellido}`} icon={<User className="h-4 w-4" />} />
                    <InfoRow label="Referencia" value={selected.numero_referencia || "—"} icon={<Ticket className="h-4 w-4" />} />
                    <InfoRow label="Teléfono" value={selected.numero_telefono || "—"} icon={<Phone className="h-4 w-4" />} />
                    <InfoRow label="Email" value={selected.email || "—"} icon={<Mail className="h-4 w-4" />} />
                    <InfoRow label="Estado" value={<StatusPill status={selected.estado} />} />
                    <InfoRow
                      label="Tickets"
                      value={
                        selected.tickets?.length
                          ? selected.tickets.map((t) => t.numero).join(", ")
                          : "—"
                      }
                      icon={<Hash className="h-4 w-4" />}
                    />
                  </div>
                </div>

                {/* Lado derecho: comprobante */}
                <div className="col-span-2 border-t border-slate-200 bg-slate-50/60 p-5 md:border-l md:border-t-0">
                  <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ImageIcon className="h-4 w-4" />
                    Comprobante
                  </div>
                  {selected.comprobante ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                      <img
                        src={b64ToBlobUrl(selected.comprobante) || undefined}
                        alt="comprobante"
                        className="max-h-[60vh] w-full rounded-md object-contain"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                      Sin comprobante
                    </div>
                  )}

                  {/* Acciones rápidas dentro del modal */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <ActionBtn
                      onClick={() => cambiarEstado(selected, "aprobado")}
                      tone="success"
                      icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    >
                      Aprobar
                    </ActionBtn>
                    <ActionBtn
                      onClick={() => cambiarEstado(selected, "pendiente")}
                      tone="warning"
                      icon={<Clock className="h-3.5 w-3.5" />}
                    >
                      Pendiente
                    </ActionBtn>
                    <ActionBtn
                      onClick={() => cambiarEstado(selected, "rechazado")}
                      tone="danger"
                      icon={<XCircle className="h-3.5 w-3.5" />}
                    >
                      Rechazar
                    </ActionBtn>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

/* ========= UI Helpers ========= */

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

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1.5 text-sm shadow-sm ring-1 transition",
        active
          ? "bg-slate-900 text-white ring-slate-900/10"
          : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-top ${className}`}>{children}</td>;
}

function SkeletonRow() {
  return (
    <tr className="border-t border-slate-100">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        </td>
      ))}
    </tr>
  );
}

function StatusPill({ status }: { status?: string | null }) {
  const s = String(status || "").toLowerCase();
  const base = "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ring-1";
  if (s === "aprobado")
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700 ring-emerald-200`}>
        <CheckCircle2 className="h-3.5 w-3.5" /> Aprobado
      </span>
    );
  if (s === "rechazado")
    return (
      <span className={`${base} bg-rose-50 text-rose-700 ring-rose-200`}>
        <XCircle className="h-3.5 w-3.5" /> Rechazado
      </span>
    );
  return (
    <span className={`${base} bg-amber-50 text-amber-800 ring-amber-200`}>
      <Clock className="h-3.5 w-3.5" /> Pendiente
    </span>
  );
}

function ActionBtn({
  children,
  onClick,
  icon,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "muted";
}) {
  const base =
    "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm transition ring-1";
  const tones: Record<string, string> = {
    default: "bg-white text-slate-700 hover:bg-slate-50 ring-slate-200",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 ring-emerald-600/10",
    warning: "bg-amber-600 text-white hover:bg-amber-700 ring-amber-600/10",
    danger: "bg-rose-600 text-white hover:bg-rose-700 ring-rose-600/10",
    muted: "bg-slate-100 text-slate-700 hover:bg-slate-200 ring-slate-200",
  };
  return (
    <button onClick={onClick} className={`${base} ${tones[tone]}`}>
      {icon}
      {children}
    </button>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm">
      <div className="flex items-start gap-2">
        {icon && (
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-700 ring-1 ring-slate-200">
            {icon}
          </div>
        )}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </div>
          <div className="mt-0.5 text-sm text-slate-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
