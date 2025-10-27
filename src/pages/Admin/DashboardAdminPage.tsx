// src/pages/admin/DashboardAdminPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  listarRifas,
  listarNumeros,
  liberarVencidas,
  buildPaymentMetaMap,
} from "../../service/rifas";
import {
  adminListParticipantes,
  adminGetParticipante,
} from "../../service/participantes.admin";
import type { Rifa, NumeroTicket, Participante } from "../../utils/types";
import { money } from "../../utils/fmt";
import {
  Sparkles,
  Ticket,
  ShoppingCart,
  Clock,
  DollarSign,
  Wand2,
} from "lucide-react";

/* ========= Helpers (sin cambios de lógica de negocio) ========= */
function isApprovedStatus(s: any): boolean {
  const v = String(s ?? "").toUpperCase();
  return ["APROBADO", "APPROVED", "COMPRADO", "PAGADO", "PAID"].includes(v);
}
function cantidadDeCompra(p: any): number {
  const porCampo = Number(p.cantidad ?? p.quantity ?? 0);
  const porLista = Array.isArray(p.numeros) ? p.numeros.length : Number(p.numero_count ?? 0);
  return porCampo || porLista || 0;
}
function sumarIngresos(aprobados: any[], precioNumero: number): number {
  return (aprobados || []).reduce((acc, o) => {
    const pagado = Number(o.monto_pagado ?? o.amount_paid ?? o.total ?? 0);
    if (pagado > 0) return acc + pagado;
    return acc + cantidadDeCompra(o) * (precioNumero || 0);
  }, 0);
}
async function enrichAprobadosConDetalle(items: any[], precioNumero: number): Promise<any[]> {
  if (!Array.isArray(items) || items.length === 0) return items;
  const needsDetail = items.filter(
    (p) =>
      !Array.isArray(p.numeros) &&
      (p.cantidad == null && p.quantity == null && p.numero_count == null)
  );
  if (needsDetail.length === 0) return items;
  const byId = new Map(items.map((p) => [p.id, p]));
  await Promise.all(
    needsDetail.map(async (p) => {
      try {
        const full = await adminGetParticipante(p.id);
        const count = Array.isArray(full?.tickets) ? full.tickets.length : 0;
        p.numero_count = count;
        if (p.monto_pagado == null && p.amount_paid == null && p.total == null) {
          p.total = count * (precioNumero || 0);
        }
        byId.set(p.id, p);
      } catch {
        // ignore
      }
    })
  );
  return Array.from(byId.values());
}

/* ========= Componente ========= */
type Stats = {
  disponibles: number;
  reservados: number;
  comprados: number;
  pendientes: number;
  ingresos: number;
};

export default function DashboardAdminPage() {
  const [rifas, setRifas] = useState<Rifa[]>([]);
  const [rifaId, setRifaId] = useState<number | null>(null);
  const [nums, setNums] = useState<NumeroTicket[]>([]);
  const [pendientes, setPendientes] = useState<Participante[]>([]);
  const [aprobados, setAprobados] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentMetaMap, setPaymentMetaMap] =
    useState<Map<number, { label: string; type?: string }>>(new Map());

  const rifa = useMemo(() => rifas.find((r) => r.id === rifaId) || null, [rifas, rifaId]);

  async function loadRifas() {
    const data = await listarRifas();
    setRifas(data);
    if (!rifaId && data.length) setRifaId(data[0].id);
  }

  async function fetchPendientes(id: number) {
    try {
      return await adminListParticipantes({ rifa_id: id, estado: "pendiente" });
    } catch {
      const all = await adminListParticipantes({ rifa_id: id } as any);
      return (all || []).filter(
        (p: any) => String(p.estado ?? p.status ?? "").toUpperCase() === "PENDIENTE"
      );
    }
  }
  async function fetchAprobados(id: number) {
    try {
      return await adminListParticipantes({ rifa_id: id, estado: "aprobado" });
    } catch {
      const all = await adminListParticipantes({ rifa_id: id } as any);
      return (all || []).filter((p: any) => isApprovedStatus(p.estado ?? p.status));
    }
  }

  async function loadData(id: number) {
    setLoading(true);
    try {
      const [numsResp, pendResp, aproRespRaw, meta] = await Promise.all([
        listarNumeros(id),
        fetchPendientes(id),
        fetchAprobados(id),
        buildPaymentMetaMap(id),
      ]);
      const precio = Number(rifas.find((r) => r.id === id)?.precio_numero ?? 0);
      const aproResp = await enrichAprobadosConDetalle(aproRespRaw, precio);
      setNums(numsResp);
      setPendientes(pendResp);
      setAprobados(aproResp);
      setPaymentMetaMap(meta);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRifas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (rifaId) loadData(rifaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rifaId]);

  const stats: Stats = useMemo(() => {
    const disponibles = nums.filter((n) => n.estado === "DISPONIBLE").length;
    const reservados = nums.filter((n) => n.estado === "RESERVADO").length;
    const comprados = aprobados.reduce((acc, p) => acc + cantidadDeCompra(p), 0);
    const precio = rifa ? Number(rifa.precio_numero) : 0;
    const ingresos = sumarIngresos(aprobados, precio);
    return { disponibles, reservados, comprados, pendientes: pendientes.length, ingresos };
  }, [nums, pendientes, aprobados, rifa]);

  async function onLiberar() {
    if (!rifaId) return;
    await liberarVencidas(rifaId);
    await loadData(rifaId);
  }

  function metodoPagoLabel(p: Participante) {
    const any: any = p;
    const typeFromAPI = any.payment_method?.type || any.payment_method_type || "";
    if (String(typeFromAPI).toUpperCase() === "PAYPAL") return "PayPal";
    const labelFromAPI = any.payment_method?.label || any.payment_method_label;
    if (labelFromAPI) return labelFromAPI;
    if (p.payment_option_id != null) {
      const meta = paymentMetaMap.get(p.payment_option_id);
      if (meta?.type && String(meta.type).toUpperCase() === "PAYPAL") return "PayPal";
      if (meta?.label) return meta.label;
    }
    return "--";
  }

  const total = (rifa?.rango_max ?? 0) - (rifa?.rango_min ?? 0) + 1;
  const vendidos = stats.comprados;
  const progreso = total > 0 ? Math.min(100, Math.round((vendidos / total) * 100)) : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <section className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        {/* Header / Controles */}
        <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-600 text-white shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
              {rifa && (
                <p className="mt-1 text-sm text-slate-600">
                  Rifa actual: <b>#{rifa.id}</b> — {rifa.titulo}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              value={rifaId ?? ""}
              onChange={(e) => setRifaId(Number(e.target.value))}
            >
              {rifas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.titulo} (#{r.id})
                </option>
              ))}
            </select>

            <button
              onClick={onLiberar}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Wand2 size={16} />
              Liberar vencidas
            </button>

            <Link
              to="/admin/rifas/crear"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black"
            >
              Crear rifa
            </Link>
            <Link
              to="/admin/productos"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Crear producto
            </Link>
            <Link
              to="/admin/rifas"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Ver rifas
            </Link>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Kpi
            title="Disponibles"
            value={stats.disponibles}
            icon={<Ticket className="h-4 w-4" />}
            accent="from-emerald-600/10 to-emerald-400/10"
          />
          <Kpi
            title="Reservados"
            value={stats.reservados}
            icon={<Clock className="h-4 w-4" />}
            accent="from-amber-600/10 to-amber-400/10"
          />
          <Kpi
            title="Comprados"
            value={stats.comprados}
            icon={<ShoppingCart className="h-4 w-4" />}
            accent="from-indigo-600/10 to-indigo-400/10"
          />
          <Kpi
            title="Pendientes"
            value={stats.pendientes}
            icon={<Clock className="h-4 w-4" />}
            accent="from-rose-600/10 to-rose-400/10"
          />
          <Kpi
            title="Ingresos"
            value={money(stats.ingresos)}
            icon={<DollarSign className="h-4 w-4" />}
            accent="from-slate-800/10 to-slate-500/10"
          />
        </div>

        {/* Progreso de venta */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">Progreso de la rifa</div>
              <p className="text-sm text-slate-600">
                Vendidos {vendidos} de {total} números
              </p>
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{progreso}%</span> completado
            </div>
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-slate-900 to-slate-600 transition-[width]"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>

        {/* Pendientes */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-slate-900">Pendientes de aprobación</h2>
            {rifa && (
              <Link
                to={`/admin/rifas/${rifa.id}`}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Ver participantes
              </Link>
            )}
          </div>

          {loading ? (
            <div className="p-4 text-sm text-slate-600">Cargando…</div>
          ) : pendientes.length === 0 ? (
            <div className="p-5 text-sm text-slate-600">No hay pendientes.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr className="text-slate-600">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Nombre</th>
                    <th className="px-3 py-2">Teléfono</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Método de pago</th>
                  </tr>
                </thead>
                <tbody>
                  {pendientes.slice(0, 8).map((p) => (
                    <tr key={p.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-700">{p.id}</td>
                      <td className="px-3 py-2 text-slate-900">
                        {p.nombre} {p.apellido}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{p.numero_telefono}</td>
                      <td className="px-3 py-2 text-slate-700">{p.email}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                          {metodoPagoLabel(p)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

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
