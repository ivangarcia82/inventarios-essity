// src/components/pos/movement-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMovement } from "@/app/actions/movements";

type Product = { id: string; name: string; sku: string | null; unit: string };
type Warehouse = { id: string; name: string; organizationId: string };

interface Props {
  products: Product[];
  warehouses: Warehouse[];
  userRole: string;
}

type MovementType = "ENTRY" | "EXIT" | "TRANSFER" | "RETURN";

const typeConfig: Record<MovementType, { label: string; needsFrom: boolean; needsTo: boolean; color: string }> = {
  ENTRY:    { label: "Entrada",       needsFrom: false, needsTo: true,  color: "bg-green-600 hover:bg-green-700" },
  EXIT:     { label: "Salida",        needsFrom: true,  needsTo: false, color: "bg-red-600 hover:bg-red-700" },
  TRANSFER: { label: "Transferencia", needsFrom: true,  needsTo: true,  color: "bg-blue-600 hover:bg-blue-700" },
  RETURN:   { label: "Devolución",    needsFrom: false, needsTo: true,  color: "bg-amber-600 hover:bg-amber-700" },
};

export function MovementForm({ products, warehouses, userRole }: Props) {
  const router = useRouter();
  const types: MovementType[] = userRole === "ADMIN_GI"
    ? ["ENTRY", "EXIT", "TRANSFER", "RETURN"]
    : ["EXIT", "TRANSFER", "RETURN"];

  const [type, setType] = useState<MovementType>(types[0]);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [fromWarehouseId, setFromWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [toWarehouseId, setToWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const config = typeConfig[type];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const qty = parseInt(quantity);
    if (!qty || qty <= 0) { setError("Cantidad inválida"); setLoading(false); return; }

    const res = await createMovement({
      type,
      productId,
      quantity: qty,
      fromWarehouseId: config.needsFrom ? fromWarehouseId : undefined,
      toWarehouseId: config.needsTo ? toWarehouseId : undefined,
      reason: reason || undefined,
      notes: notes || undefined,
    });

    if (!res.success) {
      setError(res.error ?? "Error al registrar");
    } else {
      setSuccess(true);
      setQuantity("");
      setReason("");
      setNotes("");
      setTimeout(() => { setSuccess(false); router.refresh(); }, 2000);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg space-y-5">
      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de movimiento</label>
        <div className="flex gap-2 flex-wrap">
          {types.map((t) => (
            <button type="button" key={t} onClick={() => setType(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border-2 ${type === t ? `${typeConfig[t].color} text-white border-transparent` : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
              {typeConfig[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Producto */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Producto *</label>
        <select value={productId} onChange={(e) => setProductId(e.target.value)} required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>
          ))}
        </select>
      </div>

      {/* Cantidad */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad *</label>
        <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0" />
      </div>

      {/* Almacén origen */}
      {config.needsFrom && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Almacén origen *</label>
          <select value={fromWarehouseId} onChange={(e) => setFromWarehouseId(e.target.value)} required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      )}

      {/* Almacén destino */}
      {config.needsTo && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Almacén destino *</label>
          <select value={toWarehouseId} onChange={(e) => setToWarehouseId(e.target.value)} required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      )}

      {/* Motivo */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Motivo</label>
        <input value={reason} onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ej. Evento de lanzamiento, campaña Q1..." />
      </div>

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notas adicionales</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Observaciones opcionales..." />
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
      {success && <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-3">Movimiento registrado exitosamente</p>}

      <button type="submit" disabled={loading || products.length === 0}
        className={`w-full py-3 rounded-xl text-white font-semibold transition-colors disabled:opacity-50 ${config.color}`}>
        {loading ? "Registrando..." : `Registrar ${config.label}`}
      </button>

      {products.length === 0 && (
        <p className="text-amber-600 text-sm text-center">No hay productos disponibles. El administrador debe crear productos primero.</p>
      )}
    </form>
  );
}
