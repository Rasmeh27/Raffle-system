import { http } from "./Http";
import type { Participante } from "../utils/types";

export async function adminListParticipantes(params?: {
  estado?: string;                               // pendiente | aprobado | rechazado
  rifa_id?: number;
  ticket_estado?: "RESERVADO" | "COMPRADO";
}) {
  const { data } = await http.get("/admin/participantes", { params });
  return data as Participante[];
}

export async function adminGetParticipante(id: number) {
  const { data } = await http.get(`/admin/participantes/${id}`);
  return data as Participante;                   // ← devuelve tickets cargados
}

export async function adminActualizarEstadoParticipante(id: number, nuevo_estado: string) {
  const { data } = await http.put(`/admin/participantes/${id}/estado`, { nuevo_estado });
  return data as { msg: string };
}

export async function adminEliminarParticipante(id: number) {
  const { data } = await http.delete(`/admin/participantes/${id}`);
  return data as { msg: string };
}

export function getMetodoPagoDe(p: Participante): string {
  // ver nota sobre @ts-ignore arriba
  // @ts-ignore
  const metodo =
    // @ts-ignore
    p?.payment_option?.nombre ??
    // @ts-ignore
    p?.metodo_pago ??
    // @ts-ignore
    p?.payment_method?.name ??
    // @ts-ignore
    p?.paymentOption?.nombre ??
    // @ts-ignore
    p?.paymentMethod?.name ??
    "—";
  return metodo || "—";
}