// src/app/actions/inventory.ts
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getInventory(organizationId?: string) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: "No autorizado" };

  const userRole = (session.user as any).role;
  const userOrgId = (session.user as any).organizationId;
  const targetOrgId = organizationId ?? userOrgId;

  if (userRole !== "ADMIN_GI" && targetOrgId !== userOrgId) {
    return { success: false as const, error: "No autorizado" };
  }

  const items = await prisma.inventoryItem.findMany({
    where: { product: { organizationId: targetOrgId } },
    include: {
      product: { select: { id: true, name: true, sku: true, unit: true } },
      warehouse: { select: { id: true, name: true } },
    },
    orderBy: [{ product: { name: "asc" } }, { warehouse: { name: "asc" } }],
  });

  return { success: true as const, data: items };
}

export async function getInventorySummary(organizationId?: string) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: "No autorizado" };

  const userRole = (session.user as any).role;
  const userOrgId = (session.user as any).organizationId;
  const targetOrgId = organizationId ?? userOrgId;

  if (userRole !== "ADMIN_GI" && targetOrgId !== userOrgId) {
    return { success: false as const, error: "No autorizado" };
  }

  const [totalProducts, totalStock, lowStockCount] = await Promise.all([
    prisma.product.count({ where: { organizationId: targetOrgId } }),
    prisma.inventoryItem.aggregate({
      where: { product: { organizationId: targetOrgId } },
      _sum: { quantity: true },
    }),
    prisma.inventoryItem.count({
      where: { product: { organizationId: targetOrgId }, quantity: { lte: 5 } },
    }),
  ]);

  return {
    success: true as const,
    data: {
      totalProducts,
      totalStock: totalStock._sum.quantity ?? 0,
      lowStockCount,
    },
  };
}
