// src/app/(app)/inventory/page.tsx
import { auth } from "@/lib/auth";
import { getInventory } from "@/app/actions/inventory";
import { getOrganizations } from "@/app/actions/warehouses";
import { InventoryTable } from "@/components/inventory-table";

export default async function InventoryPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role;
  const userOrgId = (session?.user as any)?.organizationId;

  const orgsRes = userRole === "ADMIN_GI" ? await getOrganizations() : { success: true, data: [] };
  const inventoryRes = await getInventory(userOrgId);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Inventario</h1>
      <InventoryTable
        initialItems={inventoryRes.success ? (inventoryRes.data as any) : []}
        orgs={orgsRes.success ? (orgsRes as any).data : []}
        userRole={userRole}
        defaultOrgId={userOrgId}
      />
    </div>
  );
}
