// src/service/rifas.ts
import { http } from "./Http";
import type {
  Rifa,
  NumeroTicket,
  RafflePaymentOptionOut,
} from "../utils/types";

// ---------- Rifas básicas ----------
export async function listarRifas(params?: { estado?: "CREADA" | "ABIERTA" | "PAUSADA" | "CERRADA" }) {
  const { data } = await http.get("/rifas", { params });
  return data as Rifa[];
}

export async function obtenerRifa(id: number) {
  const { data } = await http.get(`/rifas/${id}`);
  return data as Rifa;
}

export async function listarNumeros(
  rifaId: number,
  params?: { desde?: number; hasta?: number }
) {
  const { data } = await http.get(`/rifas/${rifaId}/numeros`, { params });
  return data as NumeroTicket[];
}

// ---------- Reservas (manual / aleatoria / liberar) ----------
export async function reservarNumeros(
  rifaId: number,
  body: { participanteId: number; numeros: number[]; minutosReserva: number }
) {
  const minutosReserva = Math.min(60, Math.max(1, Math.floor(body.minutosReserva || 10)));
  const { data } = await http.post(`/rifas/${rifaId}/reservas`, {
    participanteId: body.participanteId,
    numeros: body.numeros,
    minutosReserva,
  });
  return data as {
    rifaId: number;
    reservado: number[];
    yaReservadosMios: number[];
    noDisponibles: number[];
    total: number;
  };
}

/** Intenta alias hasta encontrar ruta válida (evita 404). */
export async function reservarAleatorios(
  rifaId: number,
  body: { participanteId: number; cantidad: number; minutosReserva: number }
) {
  const minutosReserva = Math.min(60, Math.max(1, Math.floor(body.minutosReserva || 10)));
  const payload = { participanteId: body.participanteId, cantidad: body.cantidad, minutosReserva };

  const candidates = [
    `/rifas/${rifaId}/reservas/aleatorias`, // canónica
    `/rifas/${rifaId}/reservas/aleatorio`,  // alias
    `/rifas/${rifaId}/reservas/random`,     // alias
  ];
  let lastErr: any = null;
  for (const path of candidates) {
    try {
      const { data } = await http.post(path, payload);
      return data as {
        rifaId: number;
        reservado: number[];
        yaReservadosMios: number[];
        noDisponibles: number[];
        total: number;
      };
    } catch (e: any) {
      lastErr = e;
      if (e?.response?.status !== 404) throw e;
    }
  }
  throw lastErr || new Error("No se pudo reservar aleatorios.");
}

/** Libera reservas (pasa de RESERVADO a DISPONIBLE) */
export async function liberarReservas(
  rifaId: number,
  body: { participanteId: number; numeros: number[] }
) {
  await http.delete(`/rifas/${rifaId}/reservas`, { data: body });
}

// ---------- Compras ----------
export async function confirmarCompra(params: {
  rifaId: number;
  participanteId: number;
  numeros: number[];
}) {
  const { rifaId, participanteId, numeros } = params;
  const { data } = await http.post(`/rifas/${rifaId}/compras`, {
    rifaId,
    participanteId,
    numeros,
  });
  return data as { rifaId: number; comprado: number[]; invalido: number[]; total: number };
}

// (si tienes este endpoint en tu backend; opcional)
export async function liberarVencidas(rifaId: number) {
  const { data } = await http.post(`/rifas/${rifaId}/liberar-vencidas`);
  return data as { rifaId: number; liberadas: number };
}

// ---------- Crear/actualizar rifa ----------
export async function crearRifa(body: {
  titulo: string;
  producto_id: number;
  rango_min: number;
  rango_max: number;
  precio_numero: number;
  payment_options?: import("../utils/types").RafflePaymentOption[];
}) {
  const { data } = await http.post("/rifas", body);
  return data as Rifa;
}

export async function actualizarRifa(
  id: number,
  body: Partial<{
    titulo: string;
    producto_id: number;
    precio_numero: number;
    estado: "CREADA" | "ABIERTA" | "PAUSADA" | "CERRADA";
    rango_min: number;
    rango_max: number;
    payment_options: import("../utils/types").RafflePaymentOption[];
  }>
) {
  const { data } = await http.patch(`/rifas/${id}`, body);
  return data as Rifa;
}

export async function eliminarRifa(id: number) {
  const { data } = await http.delete(`/rifas/${id}`);
  return data as { msg: string };
}

// ---------- Métodos de pago (público) ----------
export async function listarPaymentOptionsPublic(raffleId: number) {
  // público: devuelve 'method' con label/type, instrucciones, etc.
  const { data } = await http.get(`/rifas/${raffleId}/payment_options`); // underscore (ruta pública del router)
  return data as import("../utils/types").RafflePaymentOptionOut[];
}

// ---------- Métodos de pago (ADMIN) ----------
/** Lista opciones de pago de la rifa para ADMIN (incluye method detallado). */
export async function listarPaymentOptionsAdmin(raffleId: number) {
  const { data } = await http.get<RafflePaymentOptionOut[]>(
    `/rifas/${raffleId}/payment-options/admin` // con guion: coincide con el router admin
  );
  return data;
}

// ---------- Helpers Dashboard ----------
/** Normaliza posibles formas de respuesta de opciones de pago. */
function normalizeOptions(raw: any): RafflePaymentOptionOut[] {
  if (Array.isArray(raw)) return raw;
  const arr = raw?.payment_options ?? raw?.data ?? raw?.items ?? raw?.results ?? raw?.value ?? [];
  return Array.isArray(arr) ? arr : [];
}

/**
 * optionId → { label, type } (para mostrar alias y detectar PAYPAL, etc.)
 */
export async function buildPaymentMetaMap(raffleId: number) {
  const raw = await listarPaymentOptionsAdmin(raffleId);
  const options = normalizeOptions(raw);
  const map = new Map<number, { label: string; type?: string }>();
  for (const o of options) {
    const id = Number((o as any).id);
    const label = (o as any)?.method?.label ?? `Método #${(o as any)?.method?.id ?? "-"}`;
    const type = (o as any)?.method?.type ?? undefined;
    if (Number.isFinite(id)) {
      map.set(id, { label, type });
    }
  }
  return map;
}

/**
 * Retro-compat: optionId → label
 * (usa buildPaymentMetaMap por debajo)
 */
export async function buildPaymentLabelMap(raffleId: number) {
  const meta = await buildPaymentMetaMap(raffleId);
  const map = new Map<number, string>();
  meta.forEach((v, k) => map.set(k, v.label));
  return map;
}

// ---------- Público (legacy types de vista pública; opcional mantener) ----------
export type PaymentType = "TRANSFERENCIA" | "ZELLE" | "PAYPAL" | "BINANCE" | "OTRO";
export interface PaymentMethodPublic {
  id: number;
  type: PaymentType;
  label: string;
  monedas_aceptadas: string[];
  fields: Record<string, string>;
}
export interface RafflePaymentOptionPublic {
  id: number;
  instructions?: string | null;
  min_amount?: number | null;
  max_amount?: number | null;
  surcharge_pct?: number | null;
  method: PaymentMethodPublic;
}

/** Alias público (si lo usas en otra vista). */
export async function obtenerMetodosPagoRifa(rifaId: number) {
  const { data } = await http.get(`/rifas/${rifaId}/payment_options`);
  // si el backend envía wrapper, normaliza:
  const arr = normalizeOptions(data) as unknown as RafflePaymentOptionPublic[];
  return arr;
}

export async function listarTicketsDeParticipante(rifaId: number, participanteId: number) {
  const { data } = await http.get(`/rifas/${rifaId}/participantes/${participanteId}/tickets`);
  return data as number[];
}
