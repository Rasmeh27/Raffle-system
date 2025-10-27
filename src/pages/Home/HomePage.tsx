// src/pages/public/HomePage.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { listarRifas } from "../../service/rifas";
import { productosDisponibles } from "../../service/productos";
import type { Rifa, Producto } from "../../utils/types";
import { money } from "../../utils/fmt";
import { b64ToBlobUrl } from "../../utils/b64";
import {
  Search,
  Filter,
  RefreshCw,
  BadgeCheck,
  Shield,
  ArrowUpDown,
  ArrowDownZA,
  ArrowUpAZ,
  Ticket,
} from "lucide-react";

type SortKey = "recientes" | "precioAsc" | "precioDesc";

export default function HomePage() {
  const [rifas, setRifas] = useState<Rifa[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [tab, setTab] = useState<"TODAS" | "ABIERTA" | "CERRADA">("TODAS");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("recientes");

  const abiertas = useMemo(() => rifas.filter((r) => (r.estado || "").toUpperCase() === "ABIERTA"), [rifas]);
  const cerradas = useMemo(() => rifas.filter((r) => (r.estado || "").toUpperCase() === "CERRADA"), [rifas]);

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
      return "rounded-full bg-rose-100/80 px-2 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200";
    if (s === "PAUSADA")
      return "rounded-full bg-amber-100/80 px-2 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200";
    return "rounded-full bg-emerald-100/80 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200";
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
      try {
        return b64ToBlobUrl(raw) || undefined;
      } catch {
        return undefined;
      }
    }
    const prod = productos.find((p) => p.id === pid);
    if (!prod?.imagen) return undefined;
    try {
      return b64ToBlobUrl(prod.imagen) || undefined;
    } catch {
      return undefined;
    }
  }

  const query = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    let list = [...rifas];

    if (tab !== "TODAS") {
      list = list.filter((r) => (r.estado || "").toUpperCase() === tab);
    }

    if (query) {
      list = list.filter((r) => {
        const titulo = (r.titulo || "").toLowerCase();
        const desc = ((r as any)?.descripcion || "").toLowerCase();
        const prodName =
          (((r as any)?.producto?.nombre || (r as any)?.nombre) || "").toLowerCase();
        return (
          titulo.includes(query) ||
          desc.includes(query) ||
          prodName.includes(query) ||
          String(r.id).includes(query)
        );
      });
    }

    switch (sort) {
      case "precioAsc":
        list.sort((a, b) => (a.precio_numero ?? 0) - (b.precio_numero ?? 0));
        break;
      case "precioDesc":
        list.sort((a, b) => (b.precio_numero ?? 0) - (a.precio_numero ?? 0));
        break;
      default:
        // recientes: asumiendo id mayor = más reciente
        list.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
    }
    return list;
  }, [rifas, tab, query, sort]);

  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Decoración fondo */}
      <div className="pointer-events-none fixed inset-0 opacity-30 [background:radial-gradient(60rem_60rem_at_120%_-10%,#22d3ee15,transparent_60%),radial-gradient(40rem_40rem_at_-20%_120%,#a78bfa20,transparent_60%)]" />

      <section className="relative mx-auto max-w-7xl px-4 py-8 md:py-10 space-y-8">
        {/* Hero */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan-300">
                <Shield className="h-5 w-5" />
                <span className="text-xs font-semibold tracking-wide uppercase">
                  Pagos verificados
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                Rifas confiables, rápidas y transparentes
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                Elige una rifa, selecciona tus números y participa en segundos.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                  Abiertas: {abiertas.length}
                </span>
                <span className="rounded-full bg-slate-400/15 px-3 py-1 font-semibold text-slate-200 ring-1 ring-white/10">
                  Cerradas: {cerradas.length}
                </span>
              </div>
            </div>

            {/* Buscador + Orden */}
            <div className="w-full max-w-md space-y-3 md:w-auto">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  ref={searchRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por título, producto o #id…"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-9 py-2.5 text-white placeholder:text-slate-300 outline-none transition focus:border-cyan-400/50 focus:bg-white/15"
                />
                {q && (
                  <button
                    onClick={() => {
                      setQ("");
                      searchRef.current?.focus();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="appearance-none rounded-xl border border-white/10 bg-white/10 px-3 py-2 pr-9 text-sm text-white outline-none transition focus:border-cyan-400/50"
                    aria-label="Ordenar por"
                  >
                    <option value="recientes">Más recientes</option>
                    <option value="precioAsc">Precio: menor a mayor</option>
                    <option value="precioDesc">Precio: mayor a menor</option>
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-300">
                    <ArrowUpDown className="h-4 w-4" />
                  </span>
                </div>
                <button
                  onClick={() => location.reload()}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/15"
                >
                  <RefreshCw className="h-4 w-4" />
                  Recargar
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 inline-flex rounded-xl border border-white/10 bg-white/10 p-1">
            {(["TODAS", "ABIERTA", "CERRADA"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  tab === t
                    ? "bg-white/20 text-white"
                    : "text-slate-200 hover:bg-white/10"
                }`}
              >
                {t === "TODAS" ? "Todas" : t === "ABIERTA" ? "Abiertas" : "Cerradas"}
              </button>
            ))}
          </div>
        </div>

        {/* Grid / Estados */}
        {loading ? (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur"
              >
                <div className="h-48 w-full animate-pulse bg-white/10" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-3/5 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-2/5 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-white/10" />
                  <div className="h-9 w-full animate-pulse rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : err ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-sm text-rose-200">
            {err}
          </div>
        ) : (
          <RifasGrid
            rifas={filtered}
            productos={productos}
            estadoBadgeClasses={estadoBadgeClasses}
            getRifaImageSrc={getRifaImageSrc}
          />
        )}
      </section>
    </div>
  );
}

/* ===================== Sub-componente de grid ===================== */
function RifasGrid({
  rifas,
  productos,
  estadoBadgeClasses,
  getRifaImageSrc,
}: {
  rifas: Rifa[];
  productos: Producto[];
  estadoBadgeClasses: (estado?: string) => string;
  getRifaImageSrc: (r: Rifa) => string | undefined;
}) {
  if (rifas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-200 backdrop-blur">
        <p className="text-base font-medium">No hay rifas para mostrar.</p>
        <p className="text-sm text-slate-300">Ajusta filtros o vuelve más tarde.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
      {rifas.map((r) => {
        const src = getRifaImageSrc(r);
        const title = (r as any)?.producto?.nombre || r.titulo;
        return (
          <Link
            key={r.id}
            to={`/rifa/${r.id}`}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl transition-all hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)] focus:outline-none focus:ring-2 focus:ring-cyan-400/30 backdrop-blur"
          >
            {/* Imagen */}
            <div className="relative">
              {src ? (
                <img
                  src={src}
                  alt={title}
                  className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center bg-white/5">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-200">
                    <Ticket className="h-3.5 w-3.5" />
                    Sin imagen
                  </div>
                </div>
              )}

              <div className="absolute left-3 top-3 flex gap-2">
                <span className={estadoBadgeClasses(r.estado)}>{r.estado}</span>
                {(r as any)?.verificado && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100/80 px-2 py-1 text-[11px] font-semibold text-cyan-800 ring-1 ring-cyan-200">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verificada
                  </span>
                )}
              </div>

              {/* Franja inferior de realce */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
            </div>

            {/* Contenido */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="line-clamp-1 text-lg font-semibold text-white">
                  {r.titulo}
                </h3>
                <div className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1 text-right ring-1 ring-white/10">
                  <div className="text-[11px] leading-3 text-slate-200">Precio</div>
                  <div className="text-sm font-semibold text-white">
                    {money(r.precio_numero)}
                  </div>
                </div>
              </div>

              <p className="mt-2 text-sm text-slate-200/90">
                Números:{" "}
                <span className="font-medium text-white">
                  {r.rango_min}–{r.rango_max}
                </span>
              </p>

              <div className="mt-4">
                <div className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-white/20">
                  Ver detalle
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
