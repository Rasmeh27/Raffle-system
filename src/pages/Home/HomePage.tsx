// src/pages/public/HomePage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listarRifas } from "../../service/rifas";
import { productosDisponibles } from "../../service/productos";
import type { Rifa, Producto } from "../../utils/types";
import { money } from "../../utils/fmt";
import { b64ToBlobUrl } from "../../utils/b64";

export default function HomePage() {
  const [rifas, setRifas] = useState<Rifa[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const abiertas = useMemo(() => rifas.filter((r) => r.estado === "ABIERTA"), [rifas]);
  const cerradas = useMemo(() => rifas.filter((r) => r.estado === "CERRADA"), [rifas]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [rifasRes, productosRes] = await Promise.all([listarRifas(), productosDisponibles()]);
        setRifas(Array.isArray(rifasRes) ? rifasRes : []);
        setProductos(Array.isArray(productosRes) ? productosRes : []);
      } catch (e: any) {
        setErr(e?.message || "No se pudieron cargar las rifas.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function estadoBadgeClasses(estado?: string) {
    const s = String(estado || "").toUpperCase();
    if (s === "CERRADA")
      return "rounded-full bg-rose-100/80 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200";
    if (s === "PAUSADA")
      return "rounded-full bg-amber-100/80 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200";
    return "rounded-full bg-emerald-100/80 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200";
  }

  function getProductoIdFromRifa(r: Rifa): number | undefined {
    const embedded = (r as any)?.producto?.id;
    if (typeof embedded === "number") return embedded;
    const snake = (r as any)?.producto_id;
    if (typeof snake === "number") return snake;
    const camel = (r as any)?.productoId;
    if (typeof camel === "number") return camel;
    return undefined;
  }

  function getRifaImageSrc(r: Rifa): string | undefined {
    const pid = getProductoIdFromRifa(r);
    if (!pid) {
      const raw = (r as any)?.imagen || (r as any)?.producto?.imagen;
      if (!raw) return undefined;
      try { return b64ToBlobUrl(raw) || undefined; } catch { return undefined; }
    }
    const prod = productos.find((p) => p.id === pid);
    if (!prod?.imagen) return undefined;
    try { return b64ToBlobUrl(prod.imagen) || undefined; } catch { return undefined; }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-8 md:py-10 space-y-8">
        {/* Hero */}
        <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Descubre rifas confiables
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Elige tu rifa, selecciona tus números y participa en segundos.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 ring-1 ring-emerald-200">
                  Abiertas: {abiertas.length}
                </span>
                <span className="rounded-full bg-slate-50 px-3 py-1 font-medium text-slate-700 ring-1 ring-slate-200">
                  Cerradas: {cerradas.length}
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
              <div className="font-medium">Pagos verificados</div>
              <div className="text-xs text-slate-500">Protección al participante y transparencia.</div>
            </div>
          </div>
        </div>

        {/* Grid / Estados */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="h-48 w-full animate-pulse bg-slate-100" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-3/5 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-2/5 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
                  <div className="h-9 w-full animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : err ? (
          <div className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-700">
            {err}
          </div>
        ) : rifas.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-base font-medium text-slate-800">No hay rifas disponibles por ahora.</p>
            <p className="text-sm text-slate-600">Vuelve más tarde o recarga la página.</p>
            <button
              onClick={() => location.reload()}
              className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-black/30"
            >
              Recargar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {rifas.map((r) => {
              const src = getRifaImageSrc(r);
              return (
                <Link
                  key={r.id}
                  to={`/rifa/${r.id}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  {/* Imagen */}
                  <div className="relative">
                    {src ? (
                      <img
                        src={src}
                        alt={(r as any)?.producto?.nombre || r.titulo}
                        className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-48 w-full items-center justify-center bg-slate-50">
                        <div className="text-xs font-medium text-slate-400">Sin imagen</div>
                      </div>
                    )}
                    <div className="absolute left-3 top-3">
                      <span className={estadoBadgeClasses(r.estado)}>{r.estado}</span>
                    </div>
                    {/* Franja inferior de realce */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/10 to-transparent" />
                  </div>

                  {/* Contenido */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="line-clamp-1 text-lg font-semibold text-slate-900">
                        {r.titulo}
                      </h3>
                      <div className="shrink-0 rounded-lg bg-slate-50 px-2.5 py-1 text-right ring-1 ring-slate-200">
                        <div className="text-[11px] leading-3 text-slate-500">Precio</div>
                        <div className="text-sm font-semibold text-slate-900">
                          {money(r.precio_numero)}
                        </div>
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      Números:{" "}
                      <span className="font-medium text-slate-800">
                        {r.rango_min}–{r.rango_max}
                      </span>
                    </p>

                    <div className="mt-4">
                      <div className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors group-hover:bg-black">
                        Ver detalle
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
