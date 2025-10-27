// src/service/participante.ts
import { http } from "./Http";
import type { Participante } from "../utils/types";

export async function crearParticipante(form: {
  nombre: string;
  apellido: string;
  numero_telefono: string;
  numero_referencia: string;
  rifa_id: number | string;
  cantidad_numeros: number | string;
  email?: string;
  comprobante?: File | null;
  /** opcional, pero lo enviamos si el usuario seleccionó uno */
  payment_option_id?: number | string | null;
}) {
  // Validaciones mínimas
  if (!form.comprobante) {
    throw new Error("Debes adjuntar un comprobante (imagen).");
  }

  const fd = new FormData();

  fd.append("nombre", (form.nombre || "").trim());
  fd.append("apellido", (form.apellido || "").trim());
  fd.append("numero_telefono", (form.numero_telefono || "").trim());
  fd.append("numero_referencia", (form.numero_referencia || "").trim());

  // fuerza números (evita "" o " ")
  const rifaIdNum = Number(form.rifa_id);
  const cantNum = Number(form.cantidad_numeros);
  fd.append("rifa_id", String(rifaIdNum));
  fd.append("cantidad_numeros", String(cantNum));

  if (form.email && form.email.trim()) {
    fd.append("email", form.email.trim());
  }

  // si el usuario eligió método de pago, lo enviamos
  if (
    form.payment_option_id !== undefined &&
    form.payment_option_id !== null &&
    String(form.payment_option_id) !== ""
  ) {
    fd.append("payment_option_id", String(form.payment_option_id));
  }

  // archivo
  fd.append("comprobante", form.comprobante, form.comprobante.name);

  // NO seteamos Content-Type manualmente para que el navegador ponga el boundary correcto
  const { data } = await http.post("/participantes/", fd);

  // Generalmente el backend devuelve el participante con id
  // devolvemos tal cual (útil si arriba navegas con data.id)
  return data as Participante;
}
