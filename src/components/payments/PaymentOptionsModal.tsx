import { useEffect, useMemo, useState } from "react";
import { http } from "../../service/Http";
import {
  obtenerMetodosPagoRifa,
  type RafflePaymentOptionPublic,
} from "../../service/rifas";
import {
  listarMetodosOrganizador,
  type PaymentMethod,
} from "../../service/payment_method";
import NewPaymentMethodDialog from "./NewPaymentMethodDialog"; // ⬅️ importa tu diálogo

/** ========= Tipos y utilidades ========= */

export type DraftPaymentOption = {
  payment_method_id: number;
  instructions: string;
  min_amount?: number | null;
  max_amount?: number | null;
  surcharge_pct?: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  rifaId?: number | null;
  onChanged?: () => Promise<void> | void;

  // Modo borrador (sin rifaId)
  localItems?: DraftPaymentOption[];
  onLocalChange?: (items: DraftPaymentOption[]) => void;
};

type FormState = {
  id?: number; // id real (persistido) o tempId negativo (local)
  payment_method_id: number | "";
  instructions: string;
  min_amount: number | "" | null;
  max_amount: number | "" | null;
  surcharge_pct: number | "" | null;
};

const EMPTY: FormState = {
  id: undefined,
  payment_method_id: "",
  instructions: "",
  min_amount: "",
  max_amount: "",
  surcharge_pct: "",
};

function normalizeArray(raw: any): RafflePaymentOptionPublic[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as RafflePaymentOptionPublic[];
  const arr =
    raw.data ?? raw.items ?? raw.results ?? raw.value ?? raw.payment_options ?? null;
  return Array.isArray(arr) ? (arr as RafflePaymentOptionPublic[]) : [];
}

function extractErrorMessage(err: any): string {
  const payload = err?.response?.data ?? err;
  const detail = payload?.detail;
  if (detail) {
    if (Array.isArray(detail)) return detail.map((d: any) => d?.msg ?? JSON.stringify(d)).join("\n");
    if (typeof detail === "string") return detail;
    return JSON.stringify(detail);
  }
  return payload?.message ?? payload?.msg ?? "Ocurrió un error inesperado";
}

function toNumberOrNull(v: number | "" | null): number | null {
  if (v === "" || v === null || typeof v === "undefined") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** ========= CRUD persistido ========= */

async function apiCrear(
  rifaId: number,
  body: {
    payment_method_id: number;
    instructions: string;
    min_amount?: number | null;
    max_amount?: number | null;
    surcharge_pct?: number | null;
  }
) {
  const { data } = await http.post(`/rifas/${encodeURIComponent(rifaId)}/payment_options`, body);
  return data;
}

async function apiActualizar(
  rifaId: number,
  id: number,
  body: {
    payment_method_id: number;
    instructions: string;
    min_amount?: number | null;
    max_amount?: number | null;
    surcharge_pct?: number | null;
  }
) {
  const { data } = await http.put(
    `/rifas/${encodeURIComponent(rifaId)}/payment_options/${encodeURIComponent(id)}`,
    body
  );
  return data;
}

async function apiEliminar(rifaId: number, id: number) {
  const { data } = await http.delete(
    `/rifas/${encodeURIComponent(rifaId)}/payment_options/${encodeURIComponent(id)}`
  );
  return data;
}

/** ========= Componente ========= */

export default function PaymentOptionsModal({
  open,
  onClose,
  rifaId,
  onChanged,
  localItems,
  onLocalChange,
}: Props) {
  const isPersisted = typeof rifaId === "number" && !Number.isNaN(Number(rifaId));

  // Catálogo del organizador
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);

  // Lista de la rifa (persistida)
  const [serverList, setServerList] = useState<RafflePaymentOptionPublic[]>([]);
  const [loading, setLoading] = useState(false);

  // UI
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY);
  const isEdit = useMemo(() => typeof form.id === "number", [form.id]);

  // ⬇️ Diálogo “Nuevo método”
  const [newMethodOpen, setNewMethodOpen] = useState(false);

  /** ======== Cargar catálogo ======== */
  async function loadMethods() {
    setLoadingMethods(true);
    try {
      const data = await listarMetodosOrganizador();
      const activos = (data ?? []).filter((m) => m.is_active);
      setMethods(activos);
      return activos;
    } finally {
      setLoadingMethods(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    loadMethods().catch(console.error);
  }, [open]);

  /** ======== Cargar opciones de rifa (solo persistido) ======== */
  useEffect(() => {
    if (!open || !isPersisted) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await obtenerMetodosPagoRifa(rifaId as number);
        if (!alive) return;
        setServerList(normalizeArray(data));
      } catch (e: any) {
        if (!alive) return;
        setError(extractErrorMessage(e) || "No se pudieron cargar los métodos de pago.");
        setServerList([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open, isPersisted, rifaId]);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY);
      setError(null);
    }
  }, [open]);

  function resetForm() {
    setForm(EMPTY);
    setError(null);
  }

  const getMethodLabel = (id?: number | null) => {
    if (!id) return "";
    const m = methods.find((x) => x.id === id);
    return m ? `${m.label} (${m.type})` : `Método #${id}`;
  };

  /** ======== Modo borrador ======== */
  function localAddOrUpdate() {
    if (form.payment_method_id === "" || Number.isNaN(Number(form.payment_method_id))) {
      setError("Selecciona un método de pago válido.");
      return;
    }
    if (!form.instructions || form.instructions.trim().length < 3) {
      setError("Las instrucciones deben tener al menos 3 caracteres.");
      return;
    }
    const payload: DraftPaymentOption = {
      payment_method_id: Number(form.payment_method_id),
      instructions: form.instructions.trim(),
      min_amount: toNumberOrNull(form.min_amount) ?? undefined,
      max_amount: toNumberOrNull(form.max_amount) ?? undefined,
      surcharge_pct: toNumberOrNull(form.surcharge_pct) ?? undefined,
    };

    const base = localItems ?? [];
    if (isEdit && form.id && form.id < 0) {
      const idx = base.findIndex((_, i) => -(i + 1) === form.id);
      const updated = [...base];
      if (idx >= 0) updated[idx] = payload;
      onLocalChange?.(updated);
    } else {
      onLocalChange?.([...base, payload]);
    }
    resetForm();
  }

  function localEdit(index: number) {
    const item = (localItems ?? [])[index];
    setForm({
      id: -(index + 1),
      payment_method_id: item.payment_method_id ?? "",
      instructions: item.instructions ?? "",
      min_amount: item.min_amount ?? "",
      max_amount: item.max_amount ?? "",
      surcharge_pct: item.surcharge_pct ?? "",
    });
    setError(null);
  }

  function localRemove(index: number) {
    if (!confirm("¿Eliminar este método de pago?")) return;
    const base = localItems ?? [];
    const updated = base.filter((_, i) => i !== index);
    onLocalChange?.(updated);
    if (form.id === -(index + 1)) resetForm();
  }

  /** ======== Modo persistido ======== */
  function editItemServer(item: RafflePaymentOptionPublic) {
    setForm({
      id: item.id,
      payment_method_id: item.method?.id ?? "",
      instructions: item.instructions ?? "",
      min_amount: item.min_amount ?? "",
      max_amount: item.max_amount ?? "",
      surcharge_pct: item.surcharge_pct ?? "",
    });
    setError(null);
  }

  async function refreshServer() {
    const data = await obtenerMetodosPagoRifa(rifaId as number);
    setServerList(normalizeArray(data));
  }

  async function saveServer() {
    if (form.payment_method_id === "" || Number.isNaN(Number(form.payment_method_id))) {
      setError("Selecciona un método de pago válido.");
      return;
    }
    if (!form.instructions || form.instructions.trim().length < 3) {
      setError("Las instrucciones deben tener al menos 3 caracteres.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        payment_method_id: Number(form.payment_method_id),
        instructions: form.instructions.trim(),
        min_amount: toNumberOrNull(form.min_amount),
        max_amount: toNumberOrNull(form.max_amount),
        surcharge_pct: toNumberOrNull(form.surcharge_pct),
      };

      if (isEdit && form.id && (form.id as number) > 0) {
        await apiActualizar(rifaId as number, form.id as number, payload);
      } else {
        await apiCrear(rifaId as number, payload);
      }

      await refreshServer();
      resetForm();
      if (onChanged) await onChanged();
    } catch (e: any) {
      setError(extractErrorMessage(e) || "No se pudo guardar el método de pago.");
    } finally {
      setSaving(false);
    }
  }

  async function removeServer(id: number) {
    if (!confirm("¿Eliminar este método de pago?")) return;
    setDeletingId(id);
    setError(null);
    try {
      await apiEliminar(rifaId as number, id);
      await refreshServer();
      if (onChanged) await onChanged();
      if (form.id === id) resetForm();
    } catch (e: any) {
      setError(extractErrorMessage(e) || "No se pudo eliminar el método de pago.");
    } finally {
      setDeletingId(null);
    }
  }

  /** ======== Render ======== */

  if (!open) return null;

  const uiListPersisted = Array.isArray(serverList) ? serverList : [];
  const uiListLocal = Array.isArray(localItems) ? localItems : [];

  const title = "Administrar métodos de pago";
  const subtitle = isPersisted
    ? "Se guardan en la rifa"
    : "Borrador (se guardarán al crear la rifa)";
  const isSaving = saving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="mx-3 w-full max-w-5xl rounded-lg bg-white p-4 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="rounded border px-3 py-1 text-sm hover:bg-gray-50" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className="mb-3 text-xs text-gray-500">{subtitle}</div>

        {error && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700 whitespace-pre-line">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* Lista */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium">Configurados</div>
              {/* Botón abrir diálogo de nuevo método */}
              <button
                className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                onClick={() => setNewMethodOpen(true)}
              >
                Nuevo método (PayPal, etc.)
              </button>
            </div>

            <div className="max-h-80 overflow-auto rounded border">
              {isPersisted ? (
                loading ? (
                  <div className="p-3 text-sm">Cargando…</div>
                ) : uiListPersisted.length === 0 ? (
                  <div className="p-3 text-sm">No hay métodos aún.</div>
                ) : (
                  <ul className="divide-y">
                    {uiListPersisted.map((m) => (
                      <li key={m.id} className="flex items-start justify-between gap-2 p-3">
                        <div>
                          <div className="font-medium">
                            {m.method?.label
                              ? `${m.method.label} (${m.method.type})`
                              : getMethodLabel(m.method?.id)}
                          </div>
                          <div className="text-sm text-gray-700">{m.instructions || "—"}</div>
                          <div className="mt-1 text-xs text-gray-500">
                            {m.min_amount != null && <>Mín: {m.min_amount}&nbsp;</>}
                            {m.max_amount != null && <>Máx: {m.max_amount}&nbsp;</>}
                            {m.surcharge_pct != null && <>Recargo: {m.surcharge_pct}%</>}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                            onClick={() => editItemServer(m)}
                          >
                            Editar
                          </button>
                          <button
                            className="rounded border px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                            disabled={deletingId === m.id}
                            onClick={() => removeServer(m.id)}
                          >
                            {deletingId === m.id ? "Eliminando…" : "Eliminar"}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              ) : uiListLocal.length === 0 ? (
                <div className="p-3 text-sm">No hay métodos aún (borrador).</div>
              ) : (
                <ul className="divide-y">
                  {uiListLocal.map((m, idx) => (
                    <li key={idx} className="flex items-start justify-between gap-2 p-3">
                      <div>
                        <div className="font-medium">{getMethodLabel(m.payment_method_id)}</div>
                        <div className="text-sm text-gray-700">{m.instructions || "—"}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {m.min_amount != null && <>Mín: {m.min_amount}&nbsp;</>}
                          {m.max_amount != null && <>Máx: {m.max_amount}&nbsp;</>}
                          {m.surcharge_pct != null && <>Recargo: {m.surcharge_pct}%</>}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                          onClick={() => localEdit(idx)}
                        >
                          Editar
                        </button>
                        <button
                          className="rounded border px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                          onClick={() => localRemove(idx)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Form para agregar a la rifa */}
          <div className="space-y-2 rounded border p-3">
            <div className="mb-2 text-sm font-medium">{isEdit ? "Editar" : "Agregar nuevo"}</div>

            <label className="block text-sm">
              Método de pago
              <select
                className="mt-1 w-full rounded border px-3 py-2 bg-white"
                value={form.payment_method_id === "" ? "" : Number(form.payment_method_id)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    payment_method_id: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
              >
                <option value="">
                  {loadingMethods ? "Cargando…" : "Selecciona un método…"}
                </option>
                {methods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} ({m.type})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              Instrucciones
              <textarea
                className="mt-1 w-full rounded border px-3 py-2"
                rows={4}
                placeholder="Ej: Banco, cuenta, titular. Enviar comprobante por WhatsApp."
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm">
                Monto mínimo (opcional)
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  type="number"
                  value={form.min_amount ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, min_amount: e.target.value === "" ? "" : Number(e.target.value) })
                  }
                />
              </label>
              <label className="block text-sm">
                Monto máximo (opcional)
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  type="number"
                  value={form.max_amount ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, max_amount: e.target.value === "" ? "" : Number(e.target.value) })
                  }
                />
              </label>
              <label className="block text-sm">
                Recargo % (opcional)
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  type="number"
                  value={form.surcharge_pct ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      surcharge_pct: e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
                onClick={isPersisted ? saveServer : localAddOrUpdate}
                disabled={isSaving}
              >
                {isSaving ? (isEdit ? "Guardando…" : "Creando…") : isEdit ? "Guardar" : "Agregar"}
              </button>
              {isEdit && (
                <button className="rounded border px-4 py-2" onClick={resetForm}>
                  Cancelar edición
                </button>
              )}
            </div>

            {/* Catálogo rápido */}
            <div className="pt-2">
              <div className="mb-1 text-xs text-gray-500">Catálogo disponible</div>
              <div className="max-h-28 overflow-auto rounded border">
                {loadingMethods ? (
                  <div className="p-2 text-xs">Cargando catálogo…</div>
                ) : methods.length === 0 ? (
                  <div className="p-2 text-xs">No hay métodos activos.</div>
                ) : (
                  <ul className="divide-y">
                    {methods.map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-2 p-2 text-xs">
                        <div className="truncate">
                          <span className="font-medium">{m.label}</span> ({m.type})
                        </div>
                        <button
                          className="rounded border px-2 py-0.5 hover:bg-gray-50"
                          onClick={() => setForm((f) => ({ ...f, payment_method_id: Number(m.id) }))}
                        >
                          Usar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 🔹 Diálogo para CREAR un método (PayPal, etc.) */}
        <NewPaymentMethodDialog
          open={newMethodOpen}
          onClose={() => setNewMethodOpen(false)}
          onCreated={async () => {
            // refresca el catálogo y, opcional, preselecciona el último creado
            const nuevos = await loadMethods();
            // Si quieres auto-seleccionar el más reciente (por id mayor):
            const ultimo = nuevos.slice().sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0];
            if (ultimo?.id) {
              setForm((f) => ({ ...f, payment_method_id: ultimo.id! }));
            }
          }}
        />
      </div>
    </div>
  );
}
