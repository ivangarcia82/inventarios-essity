// src/components/pos/pos-terminal.tsx
"use client";

import { useState } from "react";
import { getWarehouseInventory } from "@/app/actions/inventory";
import { createBatchMovements } from "@/app/actions/movements";
import { ShoppingCart, X, Plus, Minus, PackageSearch } from "lucide-react";

type Warehouse = { id: string; name: string; organization: { name: string } };
type StockItem = {
  id: string;
  quantity: number;
  product: { id: string; name: string; sku: string | null; unit: string };
};
type CartItem = {
  productId: string;
  warehouseId: string;
  name: string;
  unit: string;
  qty: number;
  maxQty: number;
};

interface Props {
  warehouses: Warehouse[];
}

export function PosTerminal({ warehouses }: Props) {
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [stock, setStock] = useState<StockItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const loadWarehouse = async (id: string) => {
    setWarehouseId(id);
    setCart([]);
    setError("");
    setLoading(true);
    const res = await getWarehouseInventory(id);
    if (res.success) setStock(res.data as any);
    setLoading(false);
  };

  // Load initial warehouse on mount
  useState(() => {
    if (warehouses[0]?.id) loadWarehouse(warehouses[0].id);
  });

  const filtered = stock.filter(
    (s) =>
      s.product.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.product.sku ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (item: StockItem) => {
    const existing = cart.find((c) => c.productId === item.product.id);
    if (existing) {
      if (existing.qty >= existing.maxQty) return;
      setCart(cart.map((c) =>
        c.productId === item.product.id ? { ...c, qty: c.qty + 1 } : c
      ));
    } else {
      setCart([...cart, {
        productId: item.product.id,
        warehouseId,
        name: item.product.name,
        unit: item.product.unit,
        qty: 1,
        maxQty: item.quantity,
      }]);
    }
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(cart.map((c) => {
      if (c.productId !== productId) return c;
      const newQty = Math.max(1, Math.min(c.maxQty, c.qty + delta));
      return { ...c, qty: newQty };
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((c) => c.productId !== productId));
  };

  const totalUnits = cart.reduce((sum, c) => sum + c.qty, 0);

  const handleSubmit = async () => {
    if (!cart.length) return;
    setSubmitting(true);
    setError("");
    const res = await createBatchMovements(
      cart.map((c) => ({ productId: c.productId, warehouseId: c.warehouseId, quantity: c.qty }))
    );
    if (!res.success) {
      setError(res.error ?? "Error al registrar");
    } else {
      setSuccess(true);
      setCart([]);
      await loadWarehouse(warehouseId);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSubmitting(false);
  };

  const cartQty = (productId: string) => cart.find((c) => c.productId === productId)?.qty ?? 0;

  return (
    <div className="flex gap-5 h-[calc(100vh-140px)]">
      {/* Panel izquierdo — productos */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Controles */}
        <div className="flex gap-3 mb-4">
          <select
            value={warehouseId}
            onChange={(e) => loadWarehouse(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} — {w.organization.name}
              </option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto o SKU..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Grilla */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Cargando inventario...</div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
            <PackageSearch className="w-10 h-10 opacity-40" />
            <p className="text-sm">{stock.length === 0 ? "Sin productos con stock en este almacén" : "Sin resultados"}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((item) => {
                const inCart = cartQty(item.product.id);
                const outOfStock = item.quantity === 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => !outOfStock && addToCart(item)}
                    disabled={outOfStock || inCart >= item.quantity}
                    className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                      outOfStock || inCart >= item.quantity
                        ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                        : inCart > 0
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
                    }`}
                  >
                    {inCart > 0 && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                        {inCart}
                      </span>
                    )}
                    <p className="font-semibold text-slate-800 text-sm leading-tight pr-6">{item.product.name}</p>
                    {item.product.sku && (
                      <p className="text-xs text-slate-400 mt-0.5">{item.product.sku}</p>
                    )}
                    <p className={`text-sm font-medium mt-2 ${item.quantity <= 5 ? "text-red-600" : "text-slate-600"}`}>
                      {item.quantity} {item.product.unit} disponibles
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Panel derecho — carrito */}
      <div className="w-72 shrink-0 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <ShoppingCart className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-700 text-sm">Carrito</span>
          {cart.length > 0 && (
            <span className="ml-auto text-xs text-slate-400">{cart.length} producto{cart.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-300 text-sm px-4 text-center">
            Haz clic en un producto para agregarlo
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {cart.map((item) => (
              <div key={item.productId} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-slate-800 leading-tight">{item.name}</p>
                  <button onClick={() => removeFromCart(item.productId)} className="text-slate-300 hover:text-red-500 transition-colors shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.productId, -1)}
                    className="w-6 h-6 rounded border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-semibold text-slate-800 w-6 text-center">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.productId, 1)}
                    disabled={item.qty >= item.maxQty}
                    className="w-6 h-6 rounded border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 p-4 space-y-3">
          {cart.length > 0 && (
            <p className="text-xs text-slate-500 text-center">
              {cart.length} producto{cart.length !== 1 ? "s" : ""} · {totalUnits} unidad{totalUnits !== 1 ? "es" : ""} total
            </p>
          )}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>
          )}
          {success && (
            <p className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg p-2 text-center">
              ¡Salida registrada exitosamente!
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!cart.length || submitting}
            className="w-full py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40"
          >
            {submitting ? "Registrando..." : "Registrar Salida POS"}
          </button>
        </div>
      </div>
    </div>
  );
}
