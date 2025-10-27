// src/pages/public/RifaDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { obtenerRifa } from "../../service/rifas";
import { productosDisponibles } from "../../service/productos";
import type { Rifa, Producto } from "../../utils/types";
import ParticipanteForm from "./ParticipanteForm";
import { money } from "../../utils/fmt";
import { b64ToBlobUrl } from "../../utils/b64";
import { ArrowLeft, Tag, Ticket, BadgeCheck, Image as ImageIcon } from "lucide-react";

/* ================== Badges por estado ================== */
function estadoBadgeClasses(estado?: string) {
  const s = String(estado || "").toUpperCase();
  if (s === "CERRADA")
    return "rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200";
  if (s === "PAUSADA")
    return "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200";
  if (s === "CREADA")
    return "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200";
  return "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200";
}

/* ================== Helpers ================== */
function toUrl(b64?: string | null): string | undefined {
  if (!b64) return undefined;
  try {
    return b64ToBlobUrl(b64);
  } catch {
    return undefined;
  }
}

function getProductoIdFromRifa(r: any): number | undefined {
  const embedded = r?.producto?.id;
  if (typeof embedded === "number") return embedded;
  const snake = r?.producto_id;
  if (typeof snake === "number") return snake;
  const camel = r?.productoId;
  if (typeof camel === "number") return camel;
  return undefined;
}

/** Galería priorizando imágenes embebidas; si no hay, usa el producto público (como en HomePage). */
function buildImageUrls(rifa: any, productos: Producto[]): string[] {
  const urls: string[] = [];

  // 1) Galería embebida en rifa.producto.imagenes
  const imgs = rifa?.producto?.imagenes || rifa?.product?.imagenes;
  if (Array.isArray(imgs) && imgs.length) {
    for (const it of imgs) {
      const u = toUrl(it?.imagen);
      if (u) urls.push(u);
    }
  }

  // 2) Imagen principal embebida del producto
  if (!urls.length) {
    const u = toUrl(rifa?.producto?.imagen || rifa?.product?.imagen);
    if (u) urls.push(u);
  }

  // 3) Producto público (misma lógica de HomePage)
  if (!urls.length) {
    const pid = getProductoIdFromRifa(rifa);
    if (pid) {
      const prod = productos.find((p) => p.id === pid);
      const u = toUrl(prod?.imagen);
      if (u) urls.push(u);
    }
  }

  // 4) Imagen directa de la rifa
  if (!urls.length) {
    const u = toUrl(rifa?.imagen);
    if (u) urls.push(u);
  }

  return urls;
}

/* ================== Página ================== */
export default function RifaDetailPage() {
  const { id } = useParams();
  const rifaId = Number(id);
  const [rifa, setRifa] = useState<Rifa | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(rifaId)) return;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [r, prods] = await Promise.all([
          obtenerRifa(rifaId),
          productosDisponibles().catch(() => [] as Producto[]),
        ]);
        setRifa(r);
        setProductos(Array.isArray(prods) ? prods : []);
      } catch (e: any) {
        setErr(e?.response?.data?.detail || "No se pudo cargar la rifa.");
      } finally {
        setLoading(false);
      }
    })();
  }, [rifaId]);

  const imageUrls = useMemo(
    () => (rifa ? buildImageUrls(rifa as any, productos) : []),
    [rifa, productos]
  );

  useEffect(() => setActiveIdx(0), [imageUrls.length]);

  if (loading && !rifa) {
    return (
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="h-56 w-full animate-pulse bg-slate-100 md:col-span-1" />
            <div className="space-y-3 p-6 md:col-span-2">
              <div className="h-6 w-3/5 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-2/5 animate-pulse rounded bg-slate-100" />
              <div className="h-10 w-40 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-5 w-52 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {err}
      </div>
    );
  }

  if (!rifa) return null;

  const totalNums = `${rifa.rango_min}–${rifa.rango_max}`;
  const mainImg = imageUrls[activeIdx];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Imagen */}
          <div className="relative md:col-span-1">
            {mainImg ? (
              <img
                src={mainImg}
                alt={(rifa as any)?.producto?.nombre || rifa.titulo}
                className="h-56 w-full object-cover md:h-full"
              />
            ) : (
              <div className="grid h-56 place-items-center bg-slate-50 text-slate-400 md:h-full">
                <div className="flex items-center gap-2 text-sm">
                  <ImageIcon className="h-4 w-4" />
                  Sin imagen
                </div>
              </div>
            )}
            <div className="absolute left-3 top-3">
              <span className={estadoBadgeClasses(rifa.estado)}>{rifa.estado}</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-between p-6 md:col-span-2">
            <div className="space-y-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {rifa.titulo}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                  <Ticket className="h-4 w-4 text-slate-500" />
                  Números: <b className="ml-1">{totalNums}</b>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                  <Tag className="h-4 w-4 text-slate-500" />
                  Precio por número:{" "}
                  <b className="ml-1">{money(rifa.precio_numero)}</b>
                </span>
              </div>

              {(rifa as any)?.producto?.descripcion && (
                <p className="text-sm text-slate-600">
                  {(rifa as any).producto.descripcion}
                </p>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
              <div className="ml-auto inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700 ring-1 ring-emerald-200">
                <BadgeCheck className="h-4 w-4" />
                Participa en segundos
              </div>
            </div>
          </div>
        </div>

        {/* Miniaturas si hay varias */}
        {imageUrls.length > 1 && (
          <div className="border-t border-slate-200 p-3">
            <div className="no-scrollbar flex gap-3 overflow-x-auto">
              {imageUrls.map((u, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-1 transition ${
                    i === activeIdx ? "ring-slate-900" : "ring-slate-200 hover:ring-slate-300"
                  }`}
                  title={`Imagen ${i + 1}`}
                  type="button"
                >
                  <img src={u} alt={`img-${i}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Formulario (muestra la grilla al crear participante) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Tus datos</h2>
        <ParticipanteForm
          rifaId={rifaId}
          precioNumero={Number(rifa.precio_numero)}
        />
      </div>
    </div>
  );
}
