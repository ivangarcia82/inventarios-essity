// src/app/(app)/movements/new/page.tsx
import { auth } from "@/lib/auth";
import { getProducts } from "@/app/actions/products";
import { getWarehouses } from "@/app/actions/warehouses";
import { MovementForm } from "@/components/pos/movement-form";

export default async function NewMovementPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role as string;
  const userOrgId = (session?.user as any)?.organizationId as string;

  const [productsRes, warehousesRes] = await Promise.all([
    getProducts(userOrgId),
    getWarehouses(userOrgId),
  ]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Registrar Movimiento</h1>
      <p className="text-slate-500 text-sm mb-6">Registra entradas, salidas, transferencias o devoluciones de inventario.</p>
      <MovementForm
        products={productsRes.success ? (productsRes.data as any) : []}
        warehouses={warehousesRes.success ? (warehousesRes.data as any) : []}
        userRole={userRole}
      />
    </div>
  );
}
