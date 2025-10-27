// src/pages/admin/ProductosPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  adminCrearProducto,
  adminListarProductos,
  adminActualizarProducto,
  adminEliminarProducto,
} from "../../service/productos";
import type { Producto } from "../../utils/types";
import { b64ToBlobUrl } from "../../utils/b64";
import {
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Package,
  X,
  CheckCircle2,
  Search,
} from "lucide-react";

type ModalState = { id?: number } | null;

export default function ProductosPage() {
  const [list, setList] = useState<Producto[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    imagen: null as File | null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await adminListarProductos();
      setList(data);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  // filtros locales
  const filtered = useMemo(() => {
    if (!q.trim()) return list;
    const t = q.trim().toLowerCase();
    return list.filter(
      (p) =>
        p.nombre.toLowerCase().includes(t) ||
        (p.descripcion || "").toLowerCase().includes(t)
    );
  }, [list, q]);

  function up<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function reset() {
    setForm({ nombre: "", descripcion: "", imagen: null });
    setPreviewUrl(null);
    setModal(null);
    setErr(null);
    setOk(null);
  }

  async function submit() {
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      if (modal?.id) {
        // actualizar (imagen opcional)
        await adminActualizarProducto(modal.id, {
          nombre: form.nombre,
          descripcion: form.descripcion,
          imagen: form.imagen,
        });
        setOk("Producto actualizado correctamente.");
      } else {
        // crear (imagen requerida)
        if (!form.imagen) throw new Error("Selecciona una imagen.");
        await adminCrearProducto({
          nombre: form.nombre,
          descripcion: form.descripcion,
          imagen: form.imagen,
        });
        setOk("Producto creado correctamente.");
      }
      await load();
      reset();
    } catch (e: any) {
      setErr(
        e?.response?.data?.detail || e?.message || "No se pudo guardar el producto."
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar producto?")) return;
    await adminEliminarProducto(id);
    await load();
  }

  function openCreate() {
    setModal({});
    setForm({ nombre: "", descripcion: "", imagen: null });
    setPreviewUrl(null);
    setErr(null);
    setOk(null);
  }

  function openEdit(p: Producto) {
    setModal({ id: p.id });
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion || "",
      imagen: null, // opcional al actualizar
    });
    // preview inicial con la imagen existente
    setPreviewUrl(p.imagen ? b64ToBlobUrl(p.imagen) : null);
    setErr(null);
    setOk(null);
  }

  function onPickFile(file: File | null) {
    up("imagen", file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (file) setPreviewUrl(URL.createObjectURL(file));
    else setPreviewUrl(null);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-600 text-white shadow-sm">
              <Package size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Productos
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Administra los premios disponibles para tus rifas.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre o descripción…"
                className="w-48 text-sm focus:outline-none"
              />
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black"
            >
              <Plus size={16} />
              Nuevo
            </button>
          </div>
        </header>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-600">
              {list.length ? "Sin resultados para tu búsqueda." : "Aún no hay productos."}
            </p>
            <button
              onClick={openCreate}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black"
            >
              <Plus size={16} />
              Crear producto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <article
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* franja */}
                <div className="h-1 w-full bg-gradient-to-r from-slate-900 to-slate-600" />
                {/* imagen */}
                <div className="relative">
                  {p.imagen ? (
                    <img
                      src={b64ToBlobUrl(p.imagen) || undefined}
                      alt={p.nombre}
                      className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="grid h-40 w-full place-items-center bg-slate-50 text-slate-400">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>
                {/* contenido */}
                <div className="p-4">
                  <h3 className="line-clamp-1 text-lg font-semibold text-slate-900">
                    {p.nombre}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                    {p.descripcion || "—"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <ActionBtn
                      onClick={() => openEdit(p)}
                      icon={<Pencil className="h-3.5 w-3.5" />}
                    >
                      Editar
                    </ActionBtn>
                    <ActionBtn
                      tone="danger"
                      onClick={() => remove(p.id)}
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                    >
                      Eliminar
                    </ActionBtn>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Modal */}
        {modal && (
          <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-200">
                    <Package className="h-4 w-4" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {modal.id ? "Editar producto" : "Nuevo producto"}
                  </h2>
                </div>
                <button
                  onClick={reset}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Cerrar
                </button>
              </div>

              {/* mensajes */}
              {!!err && (
                <div className="mx-5 mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-sm text-rose-700">
                  <X className="mt-0.5 h-4 w-4" />
                  <span>{err}</span>
                </div>
              )}
              {!!ok && (
                <div className="mx-5 mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-sm text-emerald-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4" />
                  <span>{ok}</span>
                </div>
              )}

              {/* form */}
              <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-5">
                {/* izquierda: inputs */}
                <div className="md:col-span-3">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      Nombre
                    </span>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      value={form.nombre}
                      onChange={(e) => up("nombre", e.target.value)}
                      placeholder="Ej. iPhone 15 Pro Max"
                    />
                  </label>

                  <label className="mt-3 block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      Descripción
                    </span>
                    <textarea
                      rows={4}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      value={form.descripcion}
                      onChange={(e) => up("descripcion", e.target.value)}
                      placeholder="Características, capacidad, color, etc."
                    />
                  </label>
                </div>

                {/* derecha: imagen */}
                <div className="md:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Imagen {modal.id ? "(opcional para actualizar)" : ""}
                  </span>

                  <label className="group block cursor-pointer rounded-xl border border-dashed border-slate-300 p-3 text-center transition hover:border-slate-400">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                    />
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="preview"
                        className="h-40 w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="grid h-40 w-full place-items-center text-slate-400">
                        <div className="flex flex-col items-center">
                          <ImageIcon className="h-6 w-6" />
                          <span className="mt-1 text-xs">
                            Arrastra o haz clic para subir
                          </span>
                        </div>
                      </div>
                    )}
                  </label>
                  {previewUrl && (
                    <button
                      onClick={() => onPickFile(null)}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Quitar imagen
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3">
                <button
                  onClick={reset}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={submit}
                  disabled={
                    saving ||
                    !form.nombre.trim() ||
                    (!modal?.id && !form.imagen) // en creación, obliga imagen
                  }
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Guardando…" : modal?.id ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

/* ========== UI helpers ========== */

function ActionBtn({
  children,
  onClick,
  icon,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  tone?: "default" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm ring-1 transition";
  const tones: Record<string, string> = {
    default: "bg-white text-slate-700 hover:bg-slate-50 ring-slate-200",
    danger: "bg-rose-600 text-white hover:bg-rose-700 ring-rose-600/10",
  };
  return (
    <button onClick={onClick} className={`${base} ${tones[tone]}`}>
      {icon}
      {children}
    </button>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-slate-200 to-slate-100" />
      <div className="h-40 w-full animate-pulse bg-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/5 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="h-8 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-8 w-full animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
