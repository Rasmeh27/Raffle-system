// pages/rifas/RifaCreatePage.tsx
import { useEffect, useMemo, useState } from "react";
import { crearRifa } from "../../service/rifas";
import { adminListarProductos } from "../../service/productos";
import type { Producto, RafflePaymentOption } from "../../utils/types";
import PaymentOptionsModal from "../../components/payments/PaymentOptionsModal";
import { money } from "../../utils/fmt";
import { b64ToBlobUrl } from "../../utils/b64";
import {
  Ticket,
  Package,
  Hash,
  DollarSign,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  Wallet,
} from "lucide-react";

type FormState = {
  titulo: string;
  producto_id: number;
  rango_min: number;
  rango_max: number;
  precio_numero: number;
};

export default function RifaCreatePage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [form, setForm] = useState<FormState>({
    titulo: "",
    producto_id: 0,
    rango_min: 1,
    rango_max: 100,
    precio_numero: 100,
  });

  // Métodos de pago (borrador local)
  const [paymentOptions, setPaymentOptions] = useState<RafflePaymentOption[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ===== Load productos =====
  useEffect(() => {
    adminListarProductos().then(setProductos).catch(console.error);
  }, []);

  function up<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  // ===== Derivadas/UI helpers =====
  const selectedProducto = useMemo(
    () => productos.find((p) => p.id === form.producto_id) || null,
    [productos, form.producto_id]
  );

  const totalNumeros = useMemo(() => {
    const n = Number(form.rango_max) - Number(form.rango_min) + 1;
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [form.rango_min, form.rango_max]);

  const previewTotal = useMemo(() => {
    const t = totalNumeros * Number(form.precio_numero || 0);
    return t > 0 ? money(t) : money(0);
  }, [totalNumeros, form.precio_numero]);

  const formErrors = useMemo(() => {
    const e: string[] = [];
    if (!form.titulo.trim()) e.push("El título es obligatorio.");
    if (!form.producto_id) e.push("Selecciona un producto.");
    if (form.rango_min < 0) e.push("El rango mínimo no puede ser negativo.");
    if (form.rango_max < form.rango_min) e.push("El rango máximo debe ser mayor o igual al mínimo.");
    if (form.precio_numero <= 0) e.push("El precio por número debe ser mayor a 0.");
    return e;
  }, [form]);

  const canSubmit = formErrors.length === 0 && !loading;

  // ===== Submit =====
  async function submit() {
    setMsg(null);
    setErr(null);
    setLoading(true);
    try {
      const payload = {
        ...form,
        payment_options: paymentOptions.map((p) => ({
          payment_method_id: p.payment_method_id,
          instructions: p.instructions,
          min_amount: p.min_amount ?? null,
          max_amount: p.max_amount ?? null,
          surcharge_pct: p.surcharge_pct ?? null,
          sort_order: (p as any).sort_order ?? 0,
          is_active: (p as any).is_active ?? true,
        })),
      };
      const r = await crearRifa(payload as any);
      setMsg(`Rifa creada: #${r.id} — ${r.titulo}`);
      // Si quieres resetear:
      // setForm({ titulo:"", producto_id:0, rango_min:1, rango_max:100, precio_numero:100 });
      // setPaymentOptions([]);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "No se pudo crear la rifa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {/* Header */}
        <header className="flex items-start gap-3 rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-600 text-white shadow-sm">
            <Ticket size={18} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Crear rifa</h1>
            <p className="mt-1 text-sm text-slate-600">
              Define el producto, el rango de números y el precio. Agrega los métodos de pago antes de guardar.
            </p>
          </div>
        </header>

        {/* Mensajes */}
        {msg && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4" />
            <span>{msg}</span>
          </div>
        )}
        {err && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <X className="mt-0.5 h-4 w-4" />
            <span>{err}</span>
          </div>
        )}
        {formErrors.length > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div>
              <div className="font-semibold">Revisa el formulario:</div>
              <ul className="list-inside list-disc">
                {formErrors.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Layout principal: formulario + preview */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ===== Formulario ===== */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="h-1 w-full bg-gradient-to-r from-slate-900 to-slate-600" />
              <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                {/* Título */}
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Título</span>
                  <div className="relative">
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      value={form.titulo}
                      onChange={(e) => up("titulo", e.target.value)}
                      placeholder="Ej. iPhone 15 Pro Max"
                    />
                    <div className="pointer-events-none absolute right-3 top-2.5 text-slate-400">
                      <Package size={16} />
                    </div>
                  </div>
                </label>

                {/* Producto */}
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Producto</span>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      value={form.producto_id}
                      onChange={(e) => up("producto_id", Number(e.target.value))}
                    >
                      <option value={0}>Selecciona…</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-2.5 text-slate-400">
                      <Package size={16} />
                    </div>
                  </div>
                </label>

                {/* Rango min */}
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Rango mínimo</span>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      value={form.rango_min}
                      onChange={(e) => up("rango_min", Number(e.target.value) || 0)}
                    />
                    <div className="pointer-events-none absolute right-3 top-2.5 text-slate-400">
                      <Hash size={16} />
                    </div>
                  </div>
                </label>

                {/* Rango max */}
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Rango máximo</span>
                  <div className="relative">
                    <input
                      type="number"
                      min={form.rango_min}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      value={form.rango_max}
                      onChange={(e) => up("rango_max", Number(e.target.value) || form.rango_min)}
                    />
                    <div className="pointer-events-none absolute right-3 top-2.5 text-slate-400">
                      <Hash size={16} />
                    </div>
                  </div>
                </label>

                {/* Precio */}
                <label className="block md:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Precio por número</span>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      value={form.precio_numero}
                      onChange={(e) => up("precio_numero", Number(e.target.value) || 0)}
                    />
                    <div className="pointer-events-none absolute right-3 top-2.5 text-slate-400">
                      <DollarSign size={16} />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Total de números estimado: <b>{totalNumeros}</b> • Recaudación potencial: <b>{previewTotal}</b>
                  </p>
                </label>
              </div>
            </div>

            {/* Métodos de pago */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-200">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Métodos de pago</div>
                    <div className="text-xs text-slate-500">Se guardan junto con la rifa</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black"
                >
                  <Plus size={16} />
                  Agregar
                </button>
              </div>

              <div className="p-5">
                {paymentOptions.length === 0 ? (
                  <p className="text-sm text-slate-500">No has agregado métodos para esta rifa.</p>
                ) : (
                  <ol className="list-inside list-decimal space-y-2 text-sm">
                    {paymentOptions
                      .slice()
                      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                      .map((o, i) => (
                        <li key={`${o.payment_method_id}-${i}`} className="flex items-start justify-between">
                          <div>
                            <span className="font-medium">Método #{o.payment_method_id}</span>
                            <span className="text-slate-500">{o.instructions ? ` — ${o.instructions}` : ""}</span>
                            <div className="mt-0.5 text-xs text-slate-500">
                              {o.min_amount != null && <>Mín: {o.min_amount}&nbsp;</>}
                              {o.max_amount != null && <>Máx: {o.max_amount}&nbsp;</>}
                              {o.surcharge_pct != null && <>Recargo: {o.surcharge_pct}%</>}
                            </div>
                          </div>
                          <button
                            className="ml-2 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 shadow-sm transition hover:bg-slate-50"
                            onClick={() => setPaymentOptions((prev) => prev.filter((_, idx) => idx !== i))}
                          >
                            Quitar
                          </button>
                        </li>
                      ))}
                  </ol>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="mt-6">
              <button
                onClick={submit}
                disabled={!canSubmit}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creando…" : "Crear rifa"}
              </button>
            </div>
          </div>

          {/* ===== Preview de producto / resumen ===== */}
          <aside className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="h-1 w-full bg-gradient-to-r from-slate-200 to-slate-100" />
              <div className="p-5">
                <div className="mb-3 text-sm font-semibold text-slate-900">Vista previa</div>

                <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
                  {/* Imagen producto */}
                  <div className="relative">
                    {selectedProducto?.imagen ? (
                      <img
                        src={b64ToBlobUrl(selectedProducto.imagen) || undefined}
                        alt={selectedProducto.nombre}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-40 w-full place-items-center bg-slate-50 text-slate-400">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="space-y-2 p-4">
                    <div className="text-base font-semibold text-slate-900">
                      {form.titulo || "—"}
                    </div>
                    <div className="text-xs text-slate-500">
                      Producto: <b>{selectedProducto?.nombre || "—"}</b>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Hash className="h-3.5 w-3.5 text-slate-400" />
                      Rango: <b className="ml-1">{form.rango_min}–{form.rango_max}</b>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                      <DollarSign className="h-3.5 w-3.5" />
                      Precio por número: {money(form.precio_numero || 0)}
                    </div>
                    <div className="pt-2 text-xs text-slate-500">
                      Potencial: <b>{previewTotal}</b> ({totalNumeros} números)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
              Puedes editar los métodos de pago en cualquier momento desde el panel de la rifa.
            </div>
          </aside>
        </div>

        {/* ===== Modal de métodos de pago (MODO BORRADOR) ===== */}
        <PaymentOptionsModal
          open={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          localItems={paymentOptions}
          onLocalChange={setPaymentOptions}
        />
      </section>
    </div>
  );
}
