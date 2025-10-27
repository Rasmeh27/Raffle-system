// src/pages/public/RifaDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { obtenerRifa } from "../../service/rifas";
import type { Rifa } from "../../utils/types";
import ParticipanteForm from "./ParticipanteForm";
import { money } from "../../utils/fmt";
import { b64ToBlobUrl } from "../../utils/b64";
import { ArrowLeft, Tag, Ticket, BadgeCheck } from "lucide-react";

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

export default function RifaDetailPage() {
  const { id } = useParams();
  const rifaId = Number(id);
  const [rifa, setRifa] = useState<Rifa | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(rifaId)) return;
    setLoading(true);
    setErr(null);
    obtenerRifa(rifaId)
      .then((r) => setRifa(r))
      .catch((e) =>
        setErr(e?.response?.data?.detail || "No se pudo cargar la rifa.")
      )
      .finally(() => setLoading(false));
  }, [rifaId]);

  // Imagen (si viene de la rifa o del producto embebido)
  const imgSrc = useMemo(() => {
    try {
      const raw =
        (rifa as any)?.imagen ||
        (rifa as any)?.producto?.imagen ||
        (rifa as any)?.product?.imagen;
      if (!raw) return undefined;
      return b64ToBlobUrl(raw) || undefined;
    } catch {
      return undefined;
    }
  }, [rifa]);

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

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Imagen */}
          <div className="relative md:col-span-1">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={rifa.titulo}
                className="h-56 w-full object-cover md:h-full"
              />
            ) : (
              <div className="grid h-56 place-items-center bg-slate-50 text-slate-400 md:h-full">
                Sin imagen
              </div>
            )}
            <div className="absolute left-3 top-3">
              <span className={estadoBadgeClasses(rifa.estado)}>
                {rifa.estado}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-between p-6 md:col-span-2">
            <div className="space-y-2">
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
      </div>

      {/* Paso: formulario + grid (el formulario mostrará la grilla tras crear participante) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Tus datos
        </h2>
        <ParticipanteForm rifaId={rifaId} precioNumero={Number(rifa.precio_numero)} />
      </div>
    </div>
  );
}
