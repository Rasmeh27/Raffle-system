// src/pages/admin/RifaDetailAdminPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { obtenerRifa, liberarVencidas, listarTicketsDeParticipante } from "../../service/rifas";
import {
  adminListParticipantes,
  adminGetParticipante,
  adminActualizarEstadoParticipante,
  adminEliminarParticipante,
} from "../../service/participantes.admin";
import type { Participante, Rifa } from "../../utils/types";
import { money } from "../../utils/fmt";
import { b64ToBlobUrl } from "../../utils/b64";
import {
  ArrowLeft,
  ExternalLink,
  Wand2,
  Filter,
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
  RefreshCw,
} from "lucide-react";

export default function RifaDetailAdminPage() {
  const { id } = useParams();
  const rifaId = Number(id);
  const [rifa, setRifa] = useState<Rifa | null>(null);

  // filtros
  const [estado, setEstado] = useState<string>("");
  const [ticketEstado, setTicketEstado] = useState<"" | "RESERVADO" | "COMPRADO">("");

  const [list, setList] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(false);

  // detalle modal
  const [selected, setSelected] = useState<Participante | null>(null);
  const [loadingSelected, setLoadingSelected] = useState(false);
  const [selectedTicketsNums, setSelectedTicketsNums] = useState<number[] | null>(null);
  const [selectedErr, setSelectedErr] = useState<string | null>(null);

  const estados = useMemo(() => ["pendiente", "aprobado", "rechazado"], []);

  async function loadRifa() {
    const data = await obtenerRifa(rifaId);
    setRifa(data);
  }

  async function loadParticipantes() {
    setLoading(true);
    try {
      const params: any = { rifa_id: rifaId };
      if (estado) params.estado = estado;
      if (ticketEstado) params.ticket_estado = ticketEstado;
      const data = await adminListParticipantes(params);
      setList(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!rifaId) return;
    loadRifa();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rifaId]);

  useEffect(() => {
    if (!rifaId) return;
    loadParticipantes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rifaId, estado, ticketEstado]);

  async function verDetalle(p: Participante) {
    setLoadingSelected(true);
    setSelectedErr(null);
    setSelectedTicketsNums(null);
    try {
      const full = await adminGetParticipante(p.id);
      setSelected(full);
      const numsFromPayload =
        full?.tickets && full.tickets.length
          ? full.tickets.map((t: any) => Number(t.numero)).filter((n: any) => Number.isFinite(n))
          : [];
      if (numsFromPayload.length) {
        setSelectedTicketsNums(numsFromPayload.sort((a, b) => a - b));
      } else {
        try {
          const nums = await listarTicketsDeParticipante(rifaId, full.id);
          setSelectedTicketsNums((nums || []).sort((a, b) => a - b));
        } catch (e: any) {
          setSelectedErr(e?.message || "No se pudieron obtener los tickets.");
          setSelectedTicketsNums([]);
        }
      }
    } finally {
      setLoadingSelected(false);
    }
  }

  async function reloadSelected() {
    if (!selected) return;
    setLoadingSelected(true);
    setSelectedErr(null);
    try {
      const fresh = await adminGetParticipante(selected.id);
      setSelected(fresh);
      const numsFromPayload =
        fresh?.tickets && fresh.tickets.length
          ? fresh.tickets.map((t: any) => Number(t.numero)).filter((n: any) => Number.isFinite(n))
          : [];
      if (numsFromPayload.length) {
        setSelectedTicketsNums(numsFromPayload.sort((a, b) => a - b));
      } else {
        const nums = await listarTicketsDeParticipante(rifaId, fresh.id);
        setSelectedTicketsNums((nums || []).sort((a, b) => a - b));
      }
    } catch (e: any) {
      setSelectedErr(e?.message || "No se pudieron obtener los tickets.");
      setSelectedTicketsNums([]);
    } finally {
      setLoadingSelected(false);
    }
  }

  async function cambiarEstado(p: Participante, nuevo: string) {
    await adminActualizarEstadoParticipante(p.id, nuevo);
    await loadParticipantes();
    if (selected?.id === p.id) await reloadSelected();
  }

  async function liberar() {
    await liberarVencidas(rifaId);
    await loadParticipantes();
    if (selected) await reloadSelected();
  }

  async function eliminarParticipante(p: Participante) {
    if (!confirm(`¿Eliminar participante #${p.id}? Esta acción es permanente.`)) return;
    await adminEliminarParticipante(p.id);
    await loadParticipantes();
    if (selected?.id === p.id) setSelected(null);
  }

  // 👇 mover los hooks antes de cualquier return condicional
  const kpis = useMemo(() => {
    const total = list.length;
    const pend = list.filter((p) => (p.estado || "").toLowerCase() === "pendiente").length;
    const apro = list.filter((p) => (p.estado || "").toLowerCase() === "aprobado").length;
    const rech = list.filter((p) => (p.estado || "").toLowerCase() === "rechazado").length;
    return { total, pend, apro, rech };
  }, [list]);

  if (!rifa) return null;

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
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Rifa #{rifa.id} — {rifa.titulo}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Números: <b>{rifa.rango_min}–{rifa.rango_max}</b> • Precio por número:{" "}
                <b>{money(rifa.precio_numero)}</b>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Volver
            </Link>
            <button
              onClick={liberar}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Wand2 size={16} />
              Liberar vencidas
            </button>
            <Link
              to={`/rifa/${rifa.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black"
            >
              Vista pública
              <ExternalLink size={16} />
            </Link>
          </div>
        </header>

        {/* KPIs del subset */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi title="Total" value={kpis.total} accent="from-slate-800/10 to-slate-600/10" />
          <Kpi title="Pendientes" value={kpis.pend} accent="from-amber-600/10 to-amber-400/10" />
          <Kpi title="Aprobados" value={kpis.apro} accent="from-emerald-600/10 to-emerald-400/10" />
          <Kpi title="Rechazados" value={kpis.rech} accent="from-rose-600/10 to-rose-400/10" />
        </div>

        {/* Filtros */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <Filter size={16} />
              <span className="text-sm font-semibold">Filtros</span>
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
              {/* Estado participante */}
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-slate-500">Participante</span>
                <div className="flex flex-wrap gap-2">
                  <Chip active={estado === ""} onClick={() => setEstado("")} label="Todos" />
                  {estados.map((s) => (
                    <Chip key={s} active={estado === s} onClick={() => setEstado(s)} label={capitalize(s)} />
                  ))}
                </div>
              </div>
              {/* Estado ticket */}
              <div className="flex items-center gap-2 md:pl-4">
                <span className="text-xs uppercase tracking-wide text-slate-500">Ticket</span>
                <div className="flex flex-wrap gap-2">
                  <Chip active={ticketEstado === ""} onClick={() => setTicketEstado("")} label="Todos" />
                  <Chip active={ticketEstado === "RESERVADO"} onClick={() => setTicketEstado("RESERVADO")} label="Reservado" />
                  <Chip active={ticketEstado === "COMPRADO"} onClick={() => setTicketEstado("COMPRADO")} label="Comprado" />
                </div>
              </div>
              <button
                onClick={loadParticipantes}
                className="ml-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <span className="inline-flex items-center gap-2">
                  <RefreshCw size={16} /> Recargar
                </span>
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
                  <Th>Hora Compra</Th>
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
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  : list.map((p) => (
                      <tr key={p.id} className="border-t border-slate-100">
                        <Td>
                          <span className="inline-flex items-center gap-1">
                            <Hash className="h-3.5 w-3.5 text-slate-400" /> {p.id}
                          </span>
                        </Td>
                        <Td>
                          {p.fecha_inscripcion
                            ? new Date(p.fecha_inscripcion).toLocaleString(undefined, {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })
                            : "—"}
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
                              <div className="text-xs text-slate-500">Rifa #{p.rifa_id ?? rifa.id}</div>
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
                              onClick={() => eliminarParticipante(p)}
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
                    <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                      Sin participantes para los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal detalle */}
        {selected && (
          <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur">
              <div className="grid grid-cols-1 gap-0 md:grid-cols-5">
                {/* Lado izquierdo */}
                <div className="col-span-3 p-5">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Participante #{selected.id}
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={reloadSelected}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        {loadingSelected ? "Cargando…" : "Recargar"}
                      </button>
                      <button
                        onClick={() => setSelected(null)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        Cerrar
                      </button>
                    </div>
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
                        selectedErr ? (
                          <span className="text-rose-600">{selectedErr}</span>
                        ) : selectedTicketsNums === null || loadingSelected ? (
                          "Cargando…"
                        ) : selectedTicketsNums.length ? (
                          selectedTicketsNums.join(", ")
                        ) : (
                          "—"
                        )
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

                  {/* Acciones rápidas */}
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

function Kpi({ title, value, accent }: { title: string; value: number | string; accent: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className={`h-1 w-full bg-gradient-to-r ${accent}`} />
      <div className="p-4">
        <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
        <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
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
      {Array.from({ length: 8 }).map((_, i) => (
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
  const base = "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm transition ring-1";
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
