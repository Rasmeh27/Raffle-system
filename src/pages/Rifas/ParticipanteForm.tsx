// src/pages/public/ParticipanteForm.tsx
import { useEffect, useMemo, useState } from "react";
import { crearParticipante } from "../../service/participantes"; // OJO: singular
import { obtenerMetodosPagoRifa } from "../../service/rifas";
import FormField from "../../components/FormField";
import FileDropzone from "../../components/FileDropzone";
import RifaGrid from "../../components/RifaGrid";
import {
  Copy as CopyIcon,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Mail,
  Phone,
  Hash,
  CreditCard,
  Image as ImageIcon,
  ShieldCheck,
} from "lucide-react";

/* ================== Tipos ================== */
type PaymentType = "TRANSFERENCIA" | "ZELLE" | "PAYPAL" | "BINANCE" | "OTRO";
type PaymentMethodPublic = {
  id: number;
  type: PaymentType;
  label: string;
  monedas_aceptadas: string[];
  fields: Record<string, string>;
};
type RafflePaymentOptionPublic = {
  id: number;
  instructions?: string | null;
  min_amount?: number | null;
  max_amount?: number | null;
  surcharge_pct?: number | null;
  method: PaymentMethodPublic;
};

/* ============== Precios locales por ticket (estáticos) ============== */
const LOCAL_PRICES = [
  { country: "Colombia", code: "COP", symbol: "$", amount: 8000 },
  { country: "Perú", code: "PEN", symbol: "S/ ", amount: 8 },
  { country: "Chile", code: "CLP", symbol: "$", amount: 2000 },
] as const;

/* ================== Utils ================== */
function apiErrorToString(e: any): string {
  const detail = e?.response?.data?.detail;
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((x: any) => {
        const path = Array.isArray(x?.loc) ? x.loc.join(" → ") : "";
        return x?.msg ? `${path ? `[${path}] ` : ""}${x.msg}` : null;
      })
      .filter(Boolean);
    if (msgs.length) return msgs.join(" · ");
  }
  if (typeof detail === "string") return detail;
  if (e?.message) return e.message;
  return "No se pudo registrar el participante.";
}

function Pill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "muted" | "success" | "warn";
}) {
  const base =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 whitespace-nowrap";
  const tones: Record<string, string> = {
    default: "bg-slate-50 text-slate-700 ring-slate-200",
    muted: "bg-slate-100 text-slate-700 ring-slate-200",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
  };
  return <span className={`${base} ${tones[tone]}`}>{children}</span>;
}

function Section({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-600">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Copy({ text, className = "" }: { text: string; className?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text || "");
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        } catch {}
      }}
      className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm transition hover:bg-slate-50 ${className}`}
      title="Copiar"
    >
      <CopyIcon className="h-3.5 w-3.5" />
      {ok ? "Copiado" : "Copiar"}
    </button>
  );
}

/* ================== Detalle de método ================== */
function MetodoDetalle({ opt }: { opt: RafflePaymentOptionPublic }) {
  const { method, instructions } = opt;
  const f = method.fields || {};
  switch (method.type) {
    case "ZELLE":
      return (
        <div className="space-y-1 text-sm">
          {f.email && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Email:</span>
              <span className="truncate">{f.email}</span>
              <Copy text={f.email} />
            </div>
          )}
          {f.nombre && (
            <div>
              <span className="font-medium">Nombre:</span>{" "}
              <span className="break-words">{f.nombre}</span>
            </div>
          )}
          {instructions && <p className="text-slate-600">{instructions}</p>}
        </div>
      );
    case "TRANSFERENCIA":
      return (
        <div className="grid grid-cols-1 gap-1 text-sm">
          {f.banco && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Banco:</span>
              <span className="truncate">{f.banco}</span>
            </div>
          )}
          {f.tipo_cuenta && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Tipo:</span>
              <span className="truncate">{f.tipo_cuenta}</span>
            </div>
          )}
          {f.numero_cuenta && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Cuenta:</span>
              <span className="truncate">{f.numero_cuenta}</span>
              <Copy text={f.numero_cuenta} />
            </div>
          )}
          {f.titular && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Titular:</span>
              <span className="truncate">{f.titular}</span>
            </div>
          )}
          {f.doc && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Doc:</span>
              <span className="truncate">{f.doc}</span>
            </div>
          )}
          {instructions && <p className="text-slate-600">{instructions}</p>}
        </div>
      );
    case "PAYPAL":
      return (
        <div className="space-y-1 text-sm">
          {f.email && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Email:</span>
              <span className="truncate">{f.email}</span>
              <Copy text={f.email} />
            </div>
          )}
          {f.paypal_me_url && (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="shrink-0 font-medium">PayPal.me:</span>
              <a
                className="truncate text-indigo-600 hover:underline"
                href={f.paypal_me_url}
                target="_blank"
                rel="noreferrer"
              >
                {f.paypal_me_url}
              </a>
            </div>
          )}
          {instructions && <p className="text-slate-600">{instructions}</p>}
        </div>
      );
    case "BINANCE":
      return (
        <div className="space-y-1 text-sm">
          {f.wallet && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Wallet:</span>
              <span className="truncate">{f.wallet}</span>
              <Copy text={f.wallet} />
            </div>
          )}
          {f.red && (
            <div>
              <span className="font-medium">Red:</span>{" "}
              <span className="truncate">{f.red}</span>
            </div>
          )}
          {instructions && <p className="text-slate-600">{instructions}</p>}
        </div>
      );
    default:
      return (
        <div className="space-y-1 text-sm">
          <pre className="max-h-40 overflow-auto rounded bg-slate-50 p-2 text-xs ring-1 ring-slate-200">
            {JSON.stringify(f, null, 2)}
          </pre>
          {instructions && <p className="text-slate-600">{instructions}</p>}
        </div>
      );
  }
}

/* ================== Componente principal ================== */
export default function ParticipanteForm({
  rifaId,
  precioNumero,
}: {
  rifaId: number;
  precioNumero?: number;
}) {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    numero_telefono: "",
    numero_referencia: "",
    email: "",
    cantidad_numeros: 1,
    comprobante: null as File | null,
    payment_option_id: null as number | null,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [participanteId, setParticipanteId] = useState<number | null>(null);

  const [opciones, setOpciones] = useState<RafflePaymentOptionPublic[]>([]);
  const [cargandoOpc, setCargandoOpc] = useState(true);

  const totalUSD = useMemo(
    () => (precioNumero || 0) * (form.cantidad_numeros || 0),
    [precioNumero, form.cantidad_numeros]
  );

  useEffect(() => {
    setCargandoOpc(true);
    obtenerMetodosPagoRifa(rifaId)
      .then((res) => setOpciones(Array.isArray(res) ? res : []))
      .catch(() => setOpciones([]))
      .finally(() => setCargandoOpc(false));
  }, [rifaId]);

  const visibleError = useMemo(() => {
    if (!error) return null;
    if (form.comprobante && /comprobante|jpg|png|imagen/i.test(error)) return null;
    return error;
  }, [error, form.comprobante]);

  function up<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function inc() {
    up("cantidad_numeros", (form.cantidad_numeros || 1) + 1);
  }
  function dec() {
    up("cantidad_numeros", Math.max(1, (form.cantidad_numeros || 1) - 1));
  }

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      if (!form.nombre.trim()) throw new Error("El nombre es obligatorio.");
      if (!form.apellido.trim()) throw new Error("El apellido es obligatorio.");
      if (!form.numero_telefono.trim())
        throw new Error("El teléfono es obligatorio.");
      if (!form.numero_referencia.trim())
        throw new Error("El número de referencia es obligatorio.");
      if ((form.cantidad_numeros ?? 0) < 1)
        throw new Error("Debe seleccionar al menos 1 número.");
      if (!form.comprobante) throw new Error("Debes adjuntar el comprobante.");
      if (opciones.length > 0 && !form.payment_option_id)
        throw new Error("Selecciona un método de pago para continuar.");

      const p = await crearParticipante({
        rifa_id: rifaId,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        numero_telefono: form.numero_telefono.trim(),
        numero_referencia: form.numero_referencia.trim(),
        cantidad_numeros: Number(form.cantidad_numeros) || 1,
        email: form.email.trim() || undefined,
        comprobante: form.comprobante!,
        payment_option_id: form.payment_option_id ?? undefined,
      });

      setParticipanteId(p.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setError(apiErrorToString(e));
    } finally {
      setLoading(false);
    }
  }

  const showGrid = participanteId != null;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-600 text-white">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {showGrid ? "Selecciona tus números" : "Participar en la rifa"}
                </h2>
                {!!precioNumero && (
                  <p className="text-xs text-slate-600">
                    Precio por número:{" "}
                    <b>
                      {precioNumero.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </b>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!showGrid && (
                <Pill tone="muted">
                  Estimado:&nbsp;
                  <b>
                    {totalUSD.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </b>
                </Pill>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Seguro & Verificado
              </span>
            </div>
          </div>
        </div>

        {/* Error */}
        {visibleError && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <span>{visibleError}</span>
          </div>
        )}

        {/* Bloque: Lista de boletos (selector estilo referencia) */}
        {!showGrid && (
          <Section
            title="# LISTA DE BOLETOS"
            subtitle="Selecciona la cantidad; puedes pagar en moneda local a mismo valor por ticket"
            right={null}
          >
            <div className="space-y-4">
              <p className="text-center text-sm text-slate-600">
                Precio por ticket:{" "}
                <b>
                  {precioNumero != null
                    ? precioNumero.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })
                    : "—"}
                </b>
              </p>

              {/* Tarjetas de precios locales */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {LOCAL_PRICES.map((p) => (
                  <div
                    key={p.code}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm"
                  >
                    <div className="text-sm text-slate-600">{p.country}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {p.code} {p.symbol}
                      {p.amount.toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Total: {p.symbol}
                      {(p.amount * (form.cantidad_numeros || 1)).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Selector − / + centrado */}
              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={dec}
                  className="grid h-11 w-11 place-items-center rounded-full bg-slate-800 text-white shadow-sm hover:bg-black"
                  aria-label="Disminuir boletos"
                >
                  –
                </button>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-slate-900">
                    {form.cantidad_numeros || 1}
                  </div>
                  <div className="text-xs tracking-wide text-slate-500">BOLETOS</div>
                </div>
                <button
                  type="button"
                  onClick={inc}
                  className="grid h-11 w-11 place-items-center rounded-full bg-slate-800 text-white shadow-sm hover:bg-black"
                  aria-label="Aumentar boletos"
                >
                  +
                </button>
              </div>

              <div className="text-center text-lg font-semibold text-slate-900">
                Total:&nbsp;
                {precioNumero != null
                  ? totalUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })
                  : "—"}
              </div>
            </div>
          </Section>
        )}

        {/* Datos personales (VERTICAL 1 columna) */}
        {!showGrid && (
          <Section title="Datos personales" subtitle="Completa tu información">
            <div className="grid grid-cols-1 gap-4">
              <FormField label="Nombres">
                <div className="relative">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    value={form.nombre}
                    onChange={(e) => up("nombre", e.target.value)}
                  />
                  <div className="pointer-events-none absolute right-3 top-2.5 text-slate-400">
                    <Hash className="h-4 w-4" />
                  </div>
                </div>
              </FormField>

              <FormField label="Apellidos">
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  value={form.apellido}
                  onChange={(e) => up("apellido", e.target.value)}
                />
              </FormField>

              <FormField label="Teléfono">
                <div className="relative">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    value={form.numero_telefono}
                    onChange={(e) => up("numero_telefono", e.target.value)}
                  />
                  <div className="pointer-events-none absolute right-3 top-2.5 text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                </div>
              </FormField>

              <FormField label="Email (opcional)">
                <div className="relative">
                  <input
                    type="email"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    placeholder="tu@correo.com"
                    value={form.email}
                    onChange={(e) => up("email", e.target.value)}
                  />
                  <div className="pointer-events-none absolute right-3 top-2.5 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                </div>
              </FormField>

              <FormField label="Número de referencia">
                <div className="relative">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    placeholder="Ej: 123456 / Ref. de pago"
                    value={form.numero_referencia}
                    onChange={(e) => up("numero_referencia", e.target.value)}
                  />
                  <div className="pointer-events-none absolute right-3 top-2.5 text-slate-400">
                    <Hash className="h-4 w-4" />
                  </div>
                </div>
              </FormField>
            </div>
          </Section>
        )}

        {/* Métodos de pago (vertical) */}
        {!showGrid && (
          <Section
            title="Formas de pago"
            subtitle="Selecciona un método y sigue las instrucciones"
            right={!!precioNumero && <Pill tone="muted">Estimado: <b>{totalUSD.toLocaleString()}</b></Pill>}
          >
            {cargandoOpc ? (
              <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando…
              </div>
            ) : opciones.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                El organizador no ha configurado métodos de pago para esta rifa.
              </div>
            ) : (
              <div className="space-y-3">
                {opciones.map((opt) => {
                  const checked = form.payment_option_id === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`rounded-xl border p-3 transition ${
                        checked
                          ? "border-slate-900 ring-2 ring-slate-900/10"
                          : "border-slate-200"
                      }`}
                    >
                      <label className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment_option"
                          className="mt-1 h-4 w-4 shrink-0"
                          checked={checked}
                          onChange={() => up("payment_option_id", opt.id)}
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate font-medium text-slate-900">
                              {opt.method.label}
                            </span>
                            <Pill>{opt.method.type}</Pill>
                            {!!opt.method.monedas_aceptadas?.length && (
                              <span className="text-xs text-slate-600">
                                • Acepta: {opt.method.monedas_aceptadas.join(" · ")}
                              </span>
                            )}
                          </div>
                          <div className="mt-2">
                            <MetodoDetalle opt={opt} />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {opt.min_amount != null && <Pill tone="muted">Mín {opt.min_amount}</Pill>}
                            {opt.max_amount != null && <Pill tone="muted">Máx {opt.max_amount}</Pill>}
                            {opt.surcharge_pct != null && <Pill tone="warn">Recargo {opt.surcharge_pct}%</Pill>}
                          </div>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
            {opciones.length > 0 && form.payment_option_id == null && (
              <p className="mt-2 text-xs text-slate-500">
                Selecciona un método de pago para continuar.
              </p>
            )}
          </Section>
        )}

        {/* Comprobante */}
        {!showGrid && (
          <Section title="Subir comprobante *" subtitle="Formatos: JPG o PNG nítido">
            <div className="rounded-xl border border-dashed border-slate-300 p-2">
              <FileDropzone
                accept="image/*"
                onFile={(f) => {
                  const file = Array.isArray(f) ? f[0] : f;
                  up("comprobante", file instanceof File ? file : null);
                  setError((prev) =>
                    prev && /comprobante|jpg|png|imagen/i.test(prev) ? null : prev
                  );
                }}
              />
            </div>
            <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <ImageIcon className="h-3.5 w-3.5" />
              Adjunta una imagen JPG/PNG nítida de tu comprobante.
            </p>

            <button
              onClick={submit}
              disabled={loading}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Participar en la rifa ✨
                </>
              )}
            </button>
          </Section>
        )}

        {/* Paso 2: grilla una vez creado */}
        {showGrid && (
          <Section
            title="Selecciona tus números"
            right={<Pill tone="success">Participante #{participanteId}</Pill>}
          >
            <RifaGrid
              rifaId={rifaId}
              participanteId={participanteId!}
              cantidadDeseada={Number(form.cantidad_numeros) || 1}
            />
          </Section>
        )}
      </div>
    </div>
  );
}
