// src/pages/admin/RifaEditPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  obtenerRifa,
  actualizarRifa,
  obtenerMetodosPagoRifa,
} from "../../service/rifas";
import { adminListarProductos } from "../../service/productos";
import type { Producto, Rifa } from "../../utils/types";
import type { RafflePaymentOptionPublic } from "../../service/rifas";
import PaymentOptionsModal from "../../components/payments/PaymentOptionsModal";
import { b64ToBlobUrl } from "../../utils/b64";
import { money } from "../../utils/fmt";
import {
  ArrowLeft,
  Save,
  Wallet,
  Image as ImageIcon,
  Package,
  DollarSign,
  Hash,
  Settings2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

/* ========= UI helpers ========= */
function EstadoPill({ value }: { value: Rifa["estado"] }) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ring-1";
  const map: Record<Rifa["estado"], string> = {
    CREADA: "bg-slate-50 text-slate-700 ring-slate-200",
    ABIERTA: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    PAUSADA: "bg-amber-50 text-amber-800 ring-amber-200",
    CERRADA: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return <span className={`${base} ${map[value]}`}>{value}</span>;
}

export default function RifaEditPage() {
  const { id } = useParams();
  const rifaId = Number(id);
  const nav = useNavigate();

  const [rifa, setRifa] = useState<Rifa | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [form, setForm] = useState({
    titulo: "",
    producto_id: 0,
    precio_numero: 0,
    estado: "ABIERTA" as Rifa["estado"],
  });

  const [paymentOptions, setPaymentOptions] = useState<RafflePaymentOptionPublic[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [r, prods, opts] = await Promise.all([
          obtenerRifa(rifaId),
          adminListarProductos(),
          obtenerMetodosPagoRifa(rifaId),
        ]);
        if (!alive) return;

        setRifa(r);
        setForm({
          titulo: r.titulo,
          producto_id: r.producto_id,
          precio_numero: Number(r.precio_numero),
          estado: r.estado,
        });
        setProductos(prods);
        setPaymentOptions(Array.isArray(opts) ? opts : []);
      } catch (e: any) {
        setErr(e?.response?.data?.detail || "No se pudo cargar la rifa");
      }
    })();
    return () => {
      alive = false;
    };
  }, [rifaId]);

  async function handleSave() {
    if (!rifa) return;
    setSaving(true);
    setErr(null);
    try {
      await actualizarRifa(rifa.id, {
        titulo: form.titulo,
        producto_id: form.producto_id,
        precio_numero: form.precio_numero,
        estado: form.estado,
      });
      nav("/admin/rifas");
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  const selectedProducto = useMemo(
    () => productos.find((p) => p.id === form.producto_id) || null,
    [productos, form.producto_id]
  );

  if (!rifa) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-100" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-600 text-white shadow-sm">
              <Settings2 size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Editar rifa #{rifa.id}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Actualiza los datos principales y gestiona los métodos de pago.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/rifas"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Volver
            </Link>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </header>

        {/* Mensajes */}
        {err && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <XCircle className="mt-0.5 h-4 w-4" />
            <span>{err}</span>
          </div>
        )}

        {/* Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Formulario */}
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
                      onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                      placeholder="Ej. PlayStation 5 + 2 controles"
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
                      onChange={(e) =>
                        setForm({ ...form, producto_id: Number(e.target.value) })
                      }
                    >
                      <option value={0} disabled>
                        Selecciona un producto
                      </option>
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

                {/* Precio */}
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Precio por número
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      value={form.precio_numero}
                      onChange={(e) =>
                        setForm({ ...form, precio_numero: Number(e.target.value) })
                      }
                    />
                    <div className="pointer-events-none absolute right-3 top-2.5 text-slate-400">
                      <DollarSign size={16} />
                    </div>
                  </div>
                </label>

                {/* Estado */}
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Estado</span>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    value={form.estado}
                    onChange={(e) =>
                      setForm({ ...form, estado: e.target.value as Rifa["estado"] })
                    }
                  >
                    <option value="CREADA">CREADA</option>
                    <option value="ABIERTA">ABIERTA</option>
                    <option value="PAUSADA">PAUSADA</option>
                    <option value="CERRADA">CERRADA</option>
                  </select>
                  <div className="mt-2">
                    <EstadoPill value={form.estado} />
                  </div>
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
                    <div className="text-sm font-medium text-slate-900">
                      Métodos de pago
                    </div>
                    <div className="text-xs text-slate-500">
                      Estos se muestran en la compra de esta rifa.
                    </div>
                  </div>
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                  onClick={() => setPaymentModalOpen(true)}
                >
                  <Settings2 size={16} />
                  Administrar
                </button>
              </div>

              <div className="p-5">
                {paymentOptions.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    No hay métodos configurados.
                  </div>
                ) : (
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {paymentOptions.map((m) => (
                      <li
                        key={m.id}
                        className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {m.method?.label ?? "Método"}
                            </div>
                            <div className="mt-1 text-xs text-slate-600">
                              {m.instructions || "Sin instrucciones"}
                            </div>
                            <div className="mt-2 inline-flex items-center gap-2">
                              {m.is_active ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                                  <CheckCircle2 className="h-3 w-3" /> Activo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                                  Inactivo
                                </span>
                              )}
                              {m.surcharge_pct != null && (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200">
                                  Recargo {m.surcharge_pct}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Preview / Resumen */}
          <aside className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="h-1 w-full bg-gradient-to-r from-slate-200 to-slate-100" />
              <div className="p-5">
                <div className="mb-3 text-sm font-semibold text-slate-900">
                  Vista previa
                </div>
                <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
                  <div className="relative">
                    {selectedProducto?.imagen ? (
                      <img
                        src={b64ToBlobUrl(selectedProducto.imagen) || undefined}
                        alt={selectedProducto.nombre}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-40 w-full place-items-center bg-slate-50 text-slate-400">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="text-base font-semibold text-slate-900">
                      {form.titulo || "—"}
                    </div>
                    <div className="text-xs text-slate-500">
                      Producto: <b>{selectedProducto?.nombre || "—"}</b>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                      <DollarSign className="h-3.5 w-3.5" />
                      Precio por número: {money(form.precio_numero || 0)}
                    </div>
                    <div className="pt-1">
                      <EstadoPill value={form.estado} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
              Los cambios se aplican inmediatamente al guardar.
            </div>
          </aside>
        </div>

        {/* Modal de métodos de pago */}
        <PaymentOptionsModal
          open={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          rifaId={rifa.id}
          onChanged={async () => {
            const opts = await obtenerMetodosPagoRifa(rifa.id);
            setPaymentOptions(Array.isArray(opts) ? opts : []);
          }}
        />
      </section>
    </div>
  );
}
