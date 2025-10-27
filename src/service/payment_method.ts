import { http } from "./Http";

export type PaymentType = "TRANSFERENCIA" | "ZELLE" | "BINANCE" | "PAYPAL" | "OTRO";

export interface PaymentMethod {
  id: number;
  type: PaymentType;
  label: string;
  fields: Record<string, any>;
  monedas_aceptadas: string[];
  is_active: boolean;
  display_order: number;
}

export async function listarMetodosOrganizador() {
  const { data } = await http.get("/admin/payment_methods");
  return data as PaymentMethod[];
}

export async function crearMetodoPago(payload: {
  type: PaymentType;
  label: string;
  fields: Record<string, any>;
  monedas_aceptadas?: string[];
}) {
  const { data } = await http.post("/admin/payment_methods", payload);
  return data as PaymentMethod;
}

export async function actualizarMetodoPago(id: number, patch: Partial<PaymentMethod>) {
  const { data } = await http.patch(`/admin/payment_methods/${id}`, patch);
  return data as PaymentMethod;
}

export async function eliminarMetodoPago(id: number) {
  await http.delete(`/admin/payment_methods/${id}`);
}
