// src/components/NumberCell.tsx
import type { NumeroTicket } from "../utils/types";

/* ====== Style tokens (modern + accesible) ====== */
const tokens = {
  base:
    "aspect-square w-full flex items-center justify-center rounded-xl text-sm font-semibold select-none transition",
  focus:
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500",
  selected: "ring-2 ring-indigo-500 border-indigo-500 shadow-sm scale-[0.99]",
  // estados
  DISPONIBLE:
    "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 hover:border-indigo-400 hover:ring-2 hover:ring-indigo-100 cursor-pointer",
  RESERVADO:
    // reservado de otro
    "bg-amber-100 text-amber-900 border border-amber-300 cursor-not-allowed",
  COMPRADO:
    "bg-rose-100 text-rose-900 border border-rose-300 line-through cursor-not-allowed",
  VENDIDO:
    "bg-rose-100 text-rose-900 border border-rose-300 line-through cursor-not-allowed",
  // reservado mío y vigente (override amable)
  myReserved: "bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100",
};

/**
 * Celda de número con estados: DISPONIBLE / RESERVADO / COMPRADO / VENDIDO
 * - Mejor contraste y focus rings accesibles
 * - Soporta teclado (Enter/Espacio)
 * - Respeta `reachedMax` permitiendo solo deseleccionar
 */
export default function NumberCell({
  n,
  selected,
  onToggle,
  myParticipantId, // opcional: habilita click sobre RESERVADO propio
  reachedMax, // si llegó al cupo, bloquea nuevos (excepto deseleccionar)
}: {
  n: NumeroTicket;
  selected: boolean;
  onToggle: (n: NumeroTicket) => void;
  myParticipantId?: number;
  reachedMax?: boolean;
}) {
  const estado = ((n.estado as any) || "DISPONIBLE") as Required<
    NumeroTicket
  >["estado"];

  // ¿Reserva mía vigente?
  const reservadoPorId =
    (n as any).reservado_por_id ?? (n as any).reservadoPorId ?? null;
  const hastaMs = n.reservado_hasta ? Date.parse(n.reservado_hasta) : null;
  const reservaVigente =
    hastaMs == null ? true : !Number.isNaN(hastaMs) && Date.now() < hastaMs;

  const isMyReserved =
    estado === "RESERVADO" &&
    myParticipantId != null &&
    reservadoPorId === myParticipantId &&
    reservaVigente;

  // Clickable si disponible o mi reservado vigente
  const baseClickable = estado === "DISPONIBLE" || isMyReserved;
  const clickable = baseClickable && (!reachedMax || selected);
  const disabled = !clickable;

  // classes finales
  const baseStateClass =
    isMyReserved && !selected ? tokens.myReserved : tokens[estado];

  const title = !baseClickable
    ? estado
    : reachedMax && !selected
    ? "Has llegado a tu máximo de números"
    : isMyReserved
    ? "Reservado por ti (vigente)"
    : "Disponible";

  function handleToggle() {
    if (clickable) onToggle(n);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle(n);
    }
  }

  return (
    <button
      type="button"
      role="gridcell"
      data-status={estado}
      data-selected={selected ? "true" : "false"}
      disabled={disabled}
      onClick={handleToggle}
      onKeyDown={onKeyDown}
      title={`#${n.numero} — ${title}`}
      aria-pressed={selected}
      aria-label={`Número ${n.numero} (${String(estado).toLowerCase()})`}
      className={[
        tokens.base,
        tokens.focus,
        baseStateClass,
        selected && !disabled ? tokens.selected : "",
        disabled ? "opacity-95" : "",
        // micro-interacciones
        !disabled ? "active:scale-[0.98]" : "",
      ].join(" ")}
    >
      <span className="tabular-nums">{n.numero}</span>
    </button>
  );
}
