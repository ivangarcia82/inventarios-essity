// src/app/(app)/movements/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getMovements } from "@/app/actions/movements";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowDown, ArrowUp, ArrowLeftRight, RotateCcw } from "lucide-react";

type Movement = {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  notes: string | null;
  createdAt: Date;
  product: { name: string; unit: string; sku: string | null };
  fromWarehouse: { name: string } | null;
  toWarehouse: { name: string } | null;
  createdBy: { name: string };
};

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ENTRY:    { label: "Entrada",       icon: ArrowDown,        color: "text-green-600 bg-green-50" },
  EXIT:     { label: "Salida",        icon: ArrowUp,          color: "text-red-600 bg-red-50" },
  TRANSFER: { label: "Transferencia", icon: ArrowLeftRight,   color: "text-blue-600 bg-blue-50" },
  RETURN:   { label: "Devolución",    icon: RotateCcw,        color: "text-amber-600 bg-amber-50" },
};

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (type?: string) => {
    setLoading(true);
    const res = await getMovements(type ? { type: type as any } : undefined);
    if (res.success) setMovements(res.data as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type);
    load(type || undefined);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Historial de Movimientos</h1>

      {/* Filtros */}
      <div className="flex gap-2 mb-5">
        {["", "ENTRY", "EXIT", "TRANSFER", "RETURN"].map((t) => (
          <button key={t} onClick={() => handleTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === t ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
            {t ? typeConfig[t]?.label : "Todos"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Producto</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Origen → Destino</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Cantidad</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Motivo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Por</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Cargando...</td></tr>
            )}
            {!loading && movements.map((m) => {
              const cfg = typeConfig[m.type] ?? { label: m.type, icon: ArrowLeftRight, color: "text-slate-600 bg-slate-50" };
              const Icon = cfg.icon;
              return (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{m.product.name}</p>
                    {m.product.sku && <p className="text-xs text-slate-400">{m.product.sku}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {m.fromWarehouse?.name ?? "—"} → {m.toWarehouse?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {m.quantity} {m.product.unit}
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate">{m.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{m.createdBy.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                    {format(new Date(m.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                  </td>
                </tr>
              );
            })}
            {!loading && movements.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Sin movimientos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
