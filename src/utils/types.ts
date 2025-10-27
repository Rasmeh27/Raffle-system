export type EstadoNumero = "DISPONIBLE" | "RESERVADO" | "COMPRADO" | "VENDIDO";
export type EstadoRifa = "CREADA" | "ABIERTA" | "PAUSADA" | "CERRADA";
export type EstadoParticipacion = "pendiente" | "aprobado" | "rechazado";

export type Producto = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  imagen?: string | null; // vendrá en base64 en endpoints admin
};

export type Rifa = {
  id: number;
  titulo: string;
  producto_id: number;
  rango_min: number;
  rango_max: number;
  precio_numero: string | number;
  estado: EstadoRifa;
  created_at?: string;
  producto?: Producto;
};

export type NumeroTicket = {
  id: number;
  numero: number;
  rifa_id: number;

  // puede venir en algunos listados antiguos
  participante_id?: number | null;

  // ✅ nuevos campos opcionales para identificar reservas y compras
  //    incluimos ambas variantes por si el backend responde snake_case o camelCase
  reservado_por_id?: number | null;
  reservadoPorId?: number | null;
  comprado_por_id?: number | null;
  compradoPorId?: number | null;

  estado: EstadoNumero;
  reservado_hasta?: string | null;
  actualizado_en?: string | null;
};

// --- Métodos de pago (admin) y opciones por rifa ---

export type PaymentMethodType =
  | "BANK_TRANSFER"
  | "ZELLE"
  | "BINANCE_PAY"
  | "CASH"
  | "CARD_LINK"
  | "OTHER";

export type PaymentMethod = {
  id: number;
  type: PaymentMethodType;
  label: string;
  fields: Record<string, any>;
  monedas_aceptadas: string[];
  is_active?: boolean;
};

export type RafflePaymentOption = {
  payment_method_id: number;
  instructions?: string;
  min_amount?: number | null;
  max_amount?: number | null;
  surcharge_pct?: number | null;
  sort_order: number;
  is_active: boolean;
};

export type RafflePaymentOptionOut = RafflePaymentOption & {
  id: number;
  raffle_id: number;
  method: PaymentMethod;
};

export type Participante = {
  id: number;
  nombre: string;
  apellido: string;
  numero_telefono: string;
  numero_referencia: string;
  rifa_id: number;
  cantidad_numeros: number;
  estado: EstadoParticipacion;
  fecha_inscripcion?: string;
  comprobante?: string | null;
  hora_compra: Date | string;
  // cedula: string;
  // direccion?: string | null;
  email?: string | null;
  tickets?: { id: number; numero: string }[];
  producto?: Producto | null;

  // ✅ nuevo: método de pago elegido por el participante (para el dashboard)
  payment_option_id?: number | null;
  payment_method?: { type: PaymentMethodType | string; label: string } | null;
};
