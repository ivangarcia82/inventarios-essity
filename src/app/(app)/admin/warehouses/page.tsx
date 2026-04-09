// src/app/(app)/admin/warehouses/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getAllWarehouses, getOrganizations, createWarehouse, deleteWarehouse } from "@/app/actions/warehouses";
import { Trash2, Plus } from "lucide-react";

type Warehouse = { id: string; name: string; organizationId: string; organization: { name: string }; createdAt: Date };
type Org = { id: string; name: string };

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [name, setName] = useState("");
  const [orgId, setOrgId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [wRes, oRes] = await Promise.all([getAllWarehouses(), getOrganizations()]);
    if (wRes.success) setWarehouses(wRes.data as any);
    if (oRes.success) { setOrgs(oRes.data); setOrgId(oRes.data[0]?.id ?? ""); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await createWarehouse({ name, organizationId: orgId });
    if (!res.success) setError(res.error ?? "Error");
    else { setName(""); await load(); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este almacén?")) return;
    const res = await deleteWarehouse(id);
    if (!res.success) alert(res.error);
    else await load();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Almacenes</h1>

      {/* Formulario */}
      <form onSubmit={handleCreate} className="bg-white rounded-xl border border-slate-200 p-5 mb-6 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del almacén</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej. Bodega Norte" />
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-slate-700 mb-1">Organización</label>
          <select value={orgId} onChange={(e) => setOrgId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </form>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Organización</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {warehouses.map((w) => (
              <tr key={w.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{w.name}</td>
                <td className="px-4 py-3 text-slate-500">{w.organization.name}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(w.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {warehouses.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">Sin almacenes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
