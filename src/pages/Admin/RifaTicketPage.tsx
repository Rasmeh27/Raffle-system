import { useState } from "react";
import { listarNumeros, liberarVencidas } from "../../service/rifas";
import type { NumeroTicket } from "../../utils/types";

export default function RifaTicketsPage() {
  const [rifaId, setRifaId] = useState<number | "">("");
  const [rango, setRango] = useState({ desde: "", hasta: "" });
  const [list, setList] = useState<NumeroTicket[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    if (rifaId === "") return;
    const d = rango.desde ? Number(rango.desde) : undefined;
    const h = rango.hasta ? Number(rango.hasta) : undefined;
    const data = await listarNumeros(Number(rifaId), { desde: d, hasta: h });
    setList(data);
  }
  async function liberar() {
    if (rifaId === "") return;
    const res = await liberarVencidas(Number(rifaId));
    setMsg(`Reservas liberadas: ${res.liberadas}`);
    await load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tickets de la rifa</h1>
      {msg && <div className="rounded-md border bg-green-50 p-3 text-sm text-green-700">{msg}</div>}

      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-sm">Rifa ID</span>
          <input type="number" className="rounded-lg border px-3 py-2"
                 value={rifaId} onChange={(e)=>setRifaId(e.target.value ? Number(e.target.value) : "")} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm">Desde</span>
          <input type="number" className="rounded-lg border px-3 py-2"
                 value={rango.desde} onChange={(e)=>setRango(p=>({ ...p, desde: e.target.value }))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm">Hasta</span>
          <input type="number" className="rounded-lg border px-3 py-2"
                 value={rango.hasta} onChange={(e)=>setRango(p=>({ ...p, hasta: e.target.value }))} />
        </label>
        <button onClick={load} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Buscar</button>
        <button onClick={liberar} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100">Liberar vencidas</button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Participante</th>
              <th className="px-3 py-2">Reservado hasta</th>
              <th className="px-3 py-2">Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {list.map(n => (
              <tr key={n.id} className="border-t">
                <td className="px-3 py-2">{n.numero}</td>
                <td className="px-3 py-2">{n.estado}</td>
                <td className="px-3 py-2">{n.participante_id ?? "-"}</td>
                <td className="px-3 py-2">{n.reservado_hasta ?? "-"}</td>
                <td className="px-3 py-2">{n.actualizado_en ?? "-"}</td>
              </tr>
            ))}
            {!list.length && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
