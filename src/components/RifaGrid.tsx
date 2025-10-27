// src/components/RifaGrid.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listarNumeros,
  reservarAleatorios,
  reservarNumeros,
  confirmarCompra,
  liberarReservas,
  obtenerRifa,
} from "../service/rifas";
import type { NumeroTicket, Rifa } from "../utils/types";
import NumberCell from "./NumberCell";
import {
  RefreshCw,
  Shuffle,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShoppingCart,
  Info,
} from "lucide-react";

type Props = {
  rifaId: number;
  participanteId: number;
  /** Cantidad solicitada en el paso anterior */
  cantidadDeseada: number;
  /** Minutos de reserva temporal */
  minutosReserva?: number;
};

const PAGE_SIZE = 100;

export default function RifaGrid({
  rifaId,
  participanteId,
  cantidadDeseada,
  minutosReserva = 10,
}: Props) {
  const navigate = useNavigate();
  const N = Math.max(1, Number(cantidadDeseada) || 1);

  const [rifa, setRifa] = useState<Rifa | null>(null);
  const [tickets, setTickets] = useState<NumeroTicket[]>([]);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // selección local (números que lleva elegidos el participante)
  const [sel, setSel] = useState<Set<number>>(new Set());

  /* =================== Derivados =================== */
  const totalNumeros = useMemo(() => {
    if (!rifa) return 0;
    return rifa.rango_max - rifa.rango_min + 1;
  }, [rifa]);

  const showPagination = totalNumeros > PAGE_SIZE;
  const totalPages = useMemo(
    () => (showPagination ? Math.ceil(totalNumeros / PAGE_SIZE) : 1),
    [showPagination, totalNumeros]
  );

  const rangoActual = useMemo(() => {
    if (!rifa) return { desde: 0, hasta: 0 };
    const start = rifa.rango_min + (page - 1) * PAGE_SIZE;
    const end = Math.min(rifa.rango_max, start + PAGE_SIZE - 1);
    return { desde: start, hasta: end };
  }, [rifa, page]);

  // Solo mostramos 100 por página, aunque el backend devuelva 1–1000
  const visibleTickets = useMemo(
    () =>
      tickets.filter(
        (t) => t.numero >= rangoActual.desde && t.numero <= rangoActual.hasta
      ),
    [tickets, rangoActual]
  );

  const restantes = Math.max(0, N - sel.size);
  const reachedMax = sel.size >= N;

  /* =================== Carga inicial =================== */
  useEffect(() => {
    (async () => {
      setError(null);
      try {
        const r = await obtenerRifa(rifaId);
        setRifa(r);
      } catch {
        setError("No se pudo cargar la rifa.");
        return;
      }
      try {
        const data = await listarNumeros(rifaId); // traemos todo; la paginación es local
        setTickets(Array.isArray(data) ? data : []);
      } catch {
        setError("No se pudo cargar los números de la rifa.");
      }
    })();
  }, [rifaId]);

  /* =================== Utils =================== */
  function esDisponible(t: NumeroTicket) {
    const e = String(t.estado ?? "").toUpperCase();
    return e === "DISPONIBLE" || e === "D" || e === "AVAILABLE";
  }

  // ¿Está RESERVADO por este participante y vigente?
  function esReservadoPorMi(t: NumeroTicket) {
    const e = String(t.estado ?? "").toUpperCase();
    const reservadoPorId =
      (t as any).reservado_por_id ?? (t as any).reservadoPorId ?? null;
    if (e !== "RESERVADO" || reservadoPorId !== participanteId) return false;
    const hasta = t.reservado_hasta ? Date.parse(t.reservado_hasta) : null;
    if (hasta && !Number.isNaN(hasta)) {
      return Date.now() < hasta; // vigente
    }
    return true; // si no vino fecha, tratamos como vigente
  }

  function toggle(n: NumeroTicket) {
    const canToggleBase = esDisponible(n) || esReservadoPorMi(n);
    setSel((prev) => {
      const next = new Set(prev);
      const isSel = next.has(n.numero);
      // si alcanzó el tope, solo se permite deseleccionar
      if (!isSel && (!canToggleBase || next.size >= N)) return next;
      isSel ? next.delete(n.numero) : next.add(n.numero);
      return next;
    });
  }

  function unionOrdenada(a: Set<number>, b: number[]) {
    const merged = new Set<number>(a);
    for (const x of b) merged.add(x);
    return new Set<number>([...merged].sort((x, y) => x - y));
  }

  async function recargar() {
    if (!rifa) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const data = await listarNumeros(rifaId);
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudo recargar el estado de los números.");
    } finally {
      setBusy(false);
    }
  }

  /* =================== Acciones =================== */
  async function reservarSeleccionados() {
    if (sel.size === 0) {
      setError("No has seleccionado números.");
      return;
    }
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const numeros = Array.from(sel).sort((a, b) => a - b);
      const resp = await reservarNumeros(rifaId, {
        participanteId,
        numeros,
        minutosReserva,
      });
      setSel(new Set(resp.reservado.sort((a, b) => a - b)));
      setOk(
        resp.reservado.length
          ? `Reservados: ${resp.reservado.join(", ")}`
          : resp.noDisponibles.length
          ? `Ya no estaban disponibles: ${resp.noDisponibles.join(", ")}`
          : "No se pudieron reservar esos números."
      );
      await recargar();
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "No se pudo reservar los números seleccionados.";
      setError(typeof msg === "string" ? msg : "No se pudo reservar los números seleccionados.");
    } finally {
      setBusy(false);
    }
  }

  async function reservarAleatorio() {
    if (restantes <= 0) {
      setOk("Ya completaste la cantidad solicitada.");
      return;
    }
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const resp = await reservarAleatorios(rifaId, {
        participanteId,
        cantidad: restantes,
        minutosReserva,
      });
      setSel((prev) => unionOrdenada(prev, resp.reservado));
      setOk(
        resp.reservado.length
          ? `Aleatorios reservados: ${resp.reservado.join(", ")}`
          : "No se pudieron reservar aleatorios."
      );
      await recargar();
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "No se pudo reservar números aleatorios.";
      setError(typeof msg === "string" ? msg : "No se pudo reservar números aleatorios.");
    } finally {
      setBusy(false);
    }
  }

  async function onLimpiar() {
    if (sel.size === 0) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await liberarReservas(rifaId, {
        participanteId,
        numeros: Array.from(sel),
      });
      setSel(new Set());
      setOk("Reservas liberadas.");
      await recargar();
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "No se pudieron liberar las reservas.";
      setError(typeof msg === "string" ? msg : "No se pudieron liberar las reservas.");
    } finally {
      setBusy(false);
    }
  }

  // Comprar todas mis reservas vigentes (auto)
  async function onCompletarCompraAuto() {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const resp = await confirmarCompra({ rifaId, participanteId, numeros: [] });
      if (resp.total > 0) {
        setOk("¡Compra confirmada! Ya estás participando en la rifa.");
        setSel(new Set());
        await recargar();
        setTimeout(() => navigate("/"), 900);
      } else {
        setError("No se pudieron comprar tus reservas (pueden haber expirado).");
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "No se pudo completar la compra automática.";
      setError(typeof msg === "string" ? msg : "No se pudo completar la compra automática.");
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmarCompra() {
    if (sel.size !== N) {
      setError("Debes completar la cantidad solicitada para confirmar.");
      return;
    }
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const numeros = Array.from(sel).sort((a, b) => a - b);
      const resp = await confirmarCompra({ rifaId, participanteId, numeros });
      if (resp.total === N) {
        setOk("¡Compra confirmada! Ya estás participando en la rifa.");
        setTimeout(() => navigate("/"), 900);
      } else {
        setError(
          resp.invalido.length
            ? `Algunos números no pudieron comprarse: ${resp.invalido.join(", ")}`
            : "No se pudo confirmar la compra."
        );
      }
      await recargar();
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "No se pudo confirmar la compra.";
      setError(typeof msg === "string" ? msg : "No se pudo confirmar la compra.");
    } finally {
      setBusy(false);
    }
  }

  // Mostrar CTA AUTO solo si hay reservas vigentes mías
  const hasOwnActiveReservations = useMemo(() => {
    const now = Date.now();
    return tickets.some((t) => {
      const e = String(t.estado ?? "").toUpperCase();
      const reservadoPorId =
        (t as any).reservado_por_id ?? (t as any).reservadoPorId ?? null;
      if (e !== "RESERVADO" || reservadoPorId !== participanteId) return false;
      const hasta = t.reservado_hasta ? Date.parse(t.reservado_hasta) : null;
      return !hasta || (!Number.isNaN(hasta) && now < hasta);
    });
  }, [tickets, participanteId]);

  /* =================== UI =================== */
  return (
    <div className="space-y-4">
      {/* Barra superior */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
          <h4 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ShieldCheck className="h-4 w-4" />
            Selecciona tus números
          </h4>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={recargar}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              title="Recargar estado"
            >
              <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
              Recargar
            </button>

            <button
              type="button"
              onClick={reservarAleatorio}
              disabled={busy || restantes === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black disabled:opacity-50"
              title="Reservar aleatoriamente los que faltan"
            >
              <Shuffle className="h-4 w-4" />
              Aleatorio ({restantes})
            </button>

            <button
              type="button"
              onClick={reservarSeleccionados}
              disabled={busy || sel.size === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Reservar ({sel.size})
            </button>

            <button
              type="button"
              onClick={onLimpiar}
              disabled={busy || sel.size === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              title="Liberar mis reservas actuales"
            >
              <X className="h-4 w-4" />
              Limpiar
            </button>
          </div>
        </div>

        {/* Resumen y paginación */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
            Solicitados: <b>{N}</b>
            <span className="text-slate-300">•</span> Seleccionados: <b>{sel.size}</b>
            <span className="text-slate-300">•</span> Restantes: <b>{Math.max(0, N - sel.size)}</b>
          </div>

          {reachedMax && (
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-800 ring-1 ring-amber-200">
              <Info className="h-4 w-4" />
              Has llegado a tu máximo de números
            </div>
          )}

          {rifa && showPagination && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-slate-500">
                Página {page} de {Math.max(1, totalPages)} • Rango: {rangoActual.desde} –{" "}
                {rangoActual.hasta}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || busy}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || busy}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {ok && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {ok}
        </div>
      )}

      {/* Chips de seleccionados */}
      <div className="flex flex-wrap gap-2">
        {Array.from(sel)
          .sort((a, b) => a - b)
          .map((n) => (
            <span
              key={n}
              className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800"
            >
              #{n}
            </span>
          ))}
        {sel.size === 0 && (
          <span className="text-sm text-slate-500">Aún no has seleccionado números.</span>
        )}
      </div>

      {/* GRID (100 visibles por página) */}
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10 md:grid-cols-12">
        {visibleTickets.map((t) => {
          const isSel = sel.has(t.numero);
          return (
            <NumberCell
              key={t.numero}
              n={t}
              selected={isSel}
              onToggle={toggle}
              myParticipantId={participanteId}
              reachedMax={reachedMax}
            />
          );
        })}
      </div>

      {/* CTA: comprar reservas vigentes */}
      {hasOwnActiveReservations && (
        <div className="pt-2">
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            onClick={onCompletarCompraAuto}
            disabled={busy}
            title="Comprar todas tus reservas vigentes"
          >
            <ShoppingCart className="h-4 w-4" />
            Completar compra (mis reservas)
          </button>
        </div>
      )}

      {/* Confirmar compra (seleccionada) */}
      <div className="pt-2">
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-50"
          onClick={onConfirmarCompra}
          disabled={busy || sel.size !== N}
          title={sel.size !== N ? "Debes completar la cantidad solicitada" : "Confirmar compra"}
        >
          <ShoppingCart className="h-4 w-4" />
          Confirmar compra y participar ({sel.size}/{N})
        </button>
      </div>
    </div>
  );
}
