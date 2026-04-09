// src/components/inventory-table.tsx
"use client";

import { useState } from "react";
import { getInventory } from "@/app/actions/inventory";
import { AlertTriangle } from "lucide-react";

type InventoryItem = {
  id: string;
  quantity: number;
  product: { id: string; name: string; sku: string | null; unit: string };
  warehouse: { id: string; name: string };
};
type Org = { id: string; name: string };

interface Props {
  initialItems: InventoryItem[];
  orgs: Org[];
  userRole: string;
  defaultOrgId: string;
}

export function InventoryTable({ initialItems, orgs, userRole, defaultOrgId }: Props) {
  const [items, setItems] = useState(initialItems);
  const [selectedOrg, setSelectedOrg] = useState(defaultOrgId);
  const [search, setSearch] = useState("");

  const handleOrgChange = async (orgId: string) => {
    setSelectedOrg(orgId);
    const res = await getInventory(orgId);
    if (res.success) setItems(res.data as any);
  };

  const filtered = items.filter(
    (i) =>
      i.product.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.product.sku ?? "").toLowerCase().includes(search.toLowerCase()) ||
      i.warehouse.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Buscar producto o almacén..." />
        {userRole === "ADMIN_GI" && (
          <select value={selectedOrg} onChange={(e) => handleOrgChange(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {orgs.map((o: Org) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Producto</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">SKU</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Almacén</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{item.product.name}</td>
                <td className="px-4 py-3 text-slate-500">{item.product.sku ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">{item.warehouse.name}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`inline-flex items-center gap-1 font-semibold ${item.quantity <= 5 ? "text-red-600" : "text-slate-800"}`}>
                    {item.quantity <= 5 && <AlertTriangle className="w-3.5 h-3.5" />}
                    {item.quantity} {item.product.unit}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                {items.length === 0 ? "Sin inventario registrado" : "Sin resultados para la búsqueda"}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
