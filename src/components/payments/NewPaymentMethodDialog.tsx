import { useEffect, useMemo, useState } from "react";
import { crearMetodoPago, type PaymentType } from "../../service/payment_method";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void; // refrescar catálogo en el padre
};

// ⬅️ Incluye PAYPAL (y OTRO por si acaso)
const TIPOS: PaymentType[] = ["TRANSFERENCIA", "ZELLE", "BINANCE", "PAYPAL", "OTRO"];

/**
 * Requeridos por tipo — alineados con el backend.
 * - ZELLE: email + titular (antes enviábamos "nombre", por eso fallaba).
 * - PAYPAL: solo email requerido.
 */
const REQ_BY_TYPE: Record<PaymentType, string[]> = {
  TRANSFERENCIA: ["banco", "tipo_cuenta", "numero_cuenta", "titular", "doc"],
  ZELLE: ["email", "titular"],
  BINANCE: ["wallet", "red"], // BEP20 / TRC20 / ERC20, TRON, etc.
  PAYPAL: ["email"],
  OTRO: [],
};

const PLACEHOLDERS: Record<string, string> = {
  banco: "Banco XYZ",
  tipo_cuenta: "Corriente / Ahorros",
  numero_cuenta: "0000-0000-0000-0000",
  titular: "Nombre y Apellido",
  doc: "V-12345678 / DNI / RUT",
  email: "correo@dominio.com",
  wallet: "0x...",
  red: "BEP20 / TRC20 / ERC20",
};

export default function NewPaymentMethodDialog({ open, onClose, onCreated }: Props) {
  const [type, setType] = useState<PaymentType>("TRANSFERENCIA");
  const [label, setLabel] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [monedas, setMonedas] = useState<string>("USD"); // default útil
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setType("TRANSFERENCIA");
    setLabel("");
    setFields({});
    setMonedas("USD");
    setErr(null);
  }, [open]);

  const required = useMemo(() => REQ_BY_TYPE[type] || [], [type]);

  function upField(k: string, v: string) {
    setFields((p) => ({ ...p, [k]: v }));
  }

  async function submit() {
    setErr(null);
    try {
      if (!label.trim()) throw new Error("El título/alias del método es obligatorio.");

      // compat: si alguien llenó 'nombre' en ZELLE, mándalo como 'titular'
      if (type === "ZELLE" && fields["nombre"] && !fields["titular"]) {
        fields["titular"] = fields["nombre"];
      }

      // validar requeridos
      const missing = required.filter((k) => !String(fields[k] ?? "").trim());
      if (missing.length) {
        throw new Error(`Faltan campos obligatorios para tipo ${type}: [${missing.join(", ")}]`);
      }

      setSaving(true);
      const payload = {
        type,
        label: label.trim(),
        fields: Object.fromEntries(
          Object.entries(fields).map(([k, v]) => [k, (v ?? "").toString().trim()])
        ),
        monedas_aceptadas: monedas
          .split(",")
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean),
      };

      await crearMetodoPago(payload);
      onCreated?.();
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.detail || e?.message || "No se pudo crear el método.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  // Render de campos por tipo
  const renderCampos = () => {
    if (type === "TRANSFERENCIA") {
      const keys = ["banco", "tipo_cuenta", "numero_cuenta", "titular", "doc"];
      return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {keys.map((k) => (
            <label className="block" key={k}>
              <span className="mb-1 block text-xs uppercase text-gray-500">
                {k.replace("_", " ")}
                {REQ_BY_TYPE.TRANSFERENCIA.includes(k) ? " *" : ""}
              </span>
              <input
                className="w-full rounded-lg border px-3 py-2"
                value={fields[k] || ""}
                onChange={(e) => upField(k, e.target.value)}
                placeholder={PLACEHOLDERS[k]}
              />
            </label>
          ))}
        </div>
      );
    }

    if (type === "ZELLE") {
      const keys = ["email", "titular"]; // titular requerido (antes era 'nombre')
      return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {keys.map((k) => (
            <label className="block" key={k}>
              <span className="mb-1 block text-xs uppercase text-gray-500">
                {k} {REQ_BY_TYPE.ZELLE.includes(k) ? "*" : ""}
              </span>
              <input
                className="w-full rounded-lg border px-3 py-2"
                value={fields[k] || ""}
                onChange={(e) => upField(k, e.target.value)}
                placeholder={PLACEHOLDERS[k]}
              />
            </label>
          ))}
        </div>
      );
    }

    if (type === "BINANCE") {
      const keys = ["wallet", "red"];
      return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {keys.map((k) => (
            <label className="block" key={k}>
              <span className="mb-1 block text-xs uppercase text-gray-500">
                {k} {REQ_BY_TYPE.BINANCE.includes(k) ? "*" : ""}
              </span>
              <input
                className="w-full rounded-lg border px-3 py-2"
                value={fields[k] || ""}
                onChange={(e) => upField(k, e.target.value)}
                placeholder={PLACEHOLDERS[k]}
              />
            </label>
          ))}
        </div>
      );
    }

    if (type === "PAYPAL") {
      const keys = ["email", "titular"]; // 'titular' opcional, email requerido
      return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {keys.map((k) => (
            <label className="block" key={k}>
              <span className="mb-1 block text-xs uppercase text-gray-500">
                {k} {k === "email" ? "*" : ""}
              </span>
              <input
                className="w-full rounded-lg border px-3 py-2"
                value={fields[k] || ""}
                onChange={(e) => upField(k, e.target.value)}
                placeholder={PLACEHOLDERS[k] || (k === "email" ? "paypal@correo.com" : "Nombre del titular (opcional)")}
              />
            </label>
          ))}
        </div>
      );
    }

    // OTRO
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs uppercase text-gray-500">Campos (clave:valor)</span>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={fields["descripcion"] || ""}
            onChange={(e) => upField("descripcion", e.target.value)}
            placeholder="Descripción libre (ej: instrucciones, alias interno)"
          />
        </label>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3">
      <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Nuevo método de pago</h3>
          <button onClick={onClose} className="rounded border px-3 py-1 text-sm">Cerrar</button>
        </div>

        {err && (
          <div className="mb-3 rounded-md border bg-red-50 p-2 text-sm text-red-700">{err}</div>
        )}

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm">Tipo</span>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={type}
              onChange={(e) => setType(e.target.value as PaymentType)}
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm">Título visible (alias)</span>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={
                type === "ZELLE" ? "Zelle principal" :
                type === "BINANCE" ? "Binance USDT" :
                type === "PAYPAL" ? "PayPal principal" :
                "Banco XYZ"
              }
            />
          </label>

          <div className="rounded-lg border p-3">
            <p className="mb-2 text-sm font-medium">Datos del método</p>
            {renderCampos()}
          </div>

          <label className="block">
            <span className="mb-1 block text-sm">Monedas aceptadas (separadas por coma)</span>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="USD, VES, USDT"
              value={monedas}
              onChange={(e) => setMonedas(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded border px-4 py-2 text-sm">Cancelar</button>
          <button
            onClick={submit}
            disabled={saving}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Crear método"}
          </button>
        </div>
      </div>
    </div>
  );
}
