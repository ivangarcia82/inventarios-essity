// src/app/(app)/admin/products/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getAllProducts, createProduct, deleteProduct } from "@/app/actions/products";
import { getOrganizations } from "@/app/actions/warehouses";
import { Trash2, Plus } from "lucide-react";

type Product = { id: string; name: string; sku: string | null; unit: string; description: string | null; organization: { name: string } };
type Org = { id: string; name: string };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [form, setForm] = useState({ name: "", sku: "", unit: "pza", description: "", organizationId: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [pRes, oRes] = await Promise.all([getAllProducts(), getOrganizations()]);
    if (pRes.success) setProducts(pRes.data as any);
    if (oRes.success) { setOrgs(oRes.data); setForm((f) => ({ ...f, organizationId: oRes.data[0]?.id ?? "" })); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await createProduct({
      name: form.name,
      sku: form.sku || undefined,
      unit: form.unit,
      description: form.description || undefined,
      organizationId: form.organizationId,
    });
    if (!res.success) setError(res.error ?? "Error");
    else { setForm((f) => ({ ...f, name: "", sku: "", description: "" })); await load(); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    const res = await deleteProduct(id);
    if (!res.success) alert(res.error);
    else await load();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Productos</h1>

      <form onSubmit={handleCreate} className="bg-white rounded-xl border border-slate-200 p-5 mb-6 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej. Taza personalizada" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
          <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej. TAZA-001" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Unidad</label>
          <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {["pza", "caja", "kit", "par", "rollo"].map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Organización</label>
          <select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descripción opcional" />
        </div>
        <div className="col-span-2 flex justify-end">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            <Plus className="w-4 h-4" /> Agregar producto
          </button>
        </div>
      </form>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">SKU</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Unidad</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Organización</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                <td className="px-4 py-3 text-slate-500">{p.sku ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">{p.unit}</td>
                <td className="px-4 py-3 text-slate-500">{p.organization.name}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Sin productos</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
