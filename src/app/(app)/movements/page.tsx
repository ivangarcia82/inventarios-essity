// src/app/(app)/movements/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getMovements } from "@/app/actions/movements";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowDown, ArrowUp, ArrowLeftRight, RotateCcw, Inbox } from "lucide-react";

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

const typeConfig: Record<string, { label: string; icon: React.ElementType; badge: string }> = {
  ENTRY:    { label: "Entrada",       icon: ArrowDown,      badge: "bg-emerald-100 text-emerald-700" },
  EXIT:     { label: "Salida",        icon: ArrowUp,        badge: "bg-red-100 text-red-700" },
  TRANSFER: { label: "Transferencia", icon: ArrowLeftRight, badge: "bg-primary/10 text-primary" },
  RETURN:   { label: "Devolución",    icon: RotateCcw,      badge: "bg-amber-100 text-amber-700" },
};

const FILTERS = [
  { value: "",         label: "Todos" },
  { value: "ENTRY",    label: "Entradas" },
  { value: "EXIT",     label: "Salidas" },
  { value: "TRANSFER", label: "Transferencias" },
  { value: "RETURN",   label: "Devoluciones" },
];

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
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Movimientos</h1>
        <p className="text-sm text-slate-500 mt-0.5">Historial completo de entradas, salidas y transferencias</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleTypeFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              typeFilter === f.value
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:border-primary/40 hover:text-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Producto</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Origen → Destino</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cant.</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Motivo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuario</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">
                  Cargando movimientos...
                </td>
              </tr>
            )}
            {!loading && movements.map((m) => {
              const cfg = typeConfig[m.type] ?? { label: m.type, icon: ArrowLeftRight, badge: "bg-slate-100 text-slate-600" };
              const Icon = cfg.icon;
              return (
                <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${cfg.badge}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{m.product.name}</p>
                    {m.product.sku && (
                      <p className="text-xs text-slate-400 font-mono">{m.product.sku}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {m.fromWarehouse?.name ?? "—"} → {m.toWarehouse?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800 tabular-nums">
                    {m.quantity} <span className="font-normal text-slate-400">{m.product.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate text-xs">
                    {m.reason ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{m.createdBy.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                    {format(new Date(m.createdAt), "dd MMM yyyy · HH:mm", { locale: es })}
                  </td>
                </tr>
              );
            })}
            {!loading && movements.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Sin movimientos registrados</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
