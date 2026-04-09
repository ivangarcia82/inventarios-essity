// src/app/(app)/pos/page.tsx
import { auth } from "@/lib/auth";
import { getAllWarehouses, getWarehouses } from "@/app/actions/warehouses";
import { PosTerminal } from "@/components/pos/pos-terminal";

export default async function PosPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role as string;
  const userOrgId = (session?.user as any)?.organizationId as string;

  const warehousesRes = userRole === "ADMIN_GI"
    ? await getAllWarehouses()
    : await getWarehouses(userOrgId);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-800">Punto de Venta — Salidas</h1>
        <p className="text-slate-500 text-sm mt-1">Selecciona un almacén y agrega productos para registrar salidas rápidas.</p>
      </div>
      <PosTerminal
        warehouses={warehousesRes.success ? (warehousesRes.data as any) : []}
      />
    </div>
  );
}
