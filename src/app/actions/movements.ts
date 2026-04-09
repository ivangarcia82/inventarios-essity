// src/app/actions/movements.ts
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type MovementType = "ENTRY" | "EXIT" | "TRANSFER" | "RETURN";

interface CreateMovementInput {
  type: MovementType;
  productId: string;
  quantity: number;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  reason?: string;
  notes?: string;
}

export async function createMovement(input: CreateMovementInput) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: "No autorizado" };

  const userId = (session.user as any).id as string;
  const userOrgId = (session.user as any).organizationId as string;
  const userRole = (session.user as any).role as string;

  if (input.quantity <= 0) return { success: false as const, error: "La cantidad debe ser mayor a 0" };

  // Verificar que el producto pertenece a la organización del usuario (o admin puede moverlo)
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) return { success: false as const, error: "Producto no encontrado" };
  if (userRole !== "ADMIN_GI" && product.organizationId !== userOrgId) {
    return { success: false as const, error: "No autorizado para mover este producto" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Validar stock de origen si aplica
      if (input.fromWarehouseId) {
        const originItem = await tx.inventoryItem.findUnique({
          where: { productId_warehouseId: { productId: input.productId, warehouseId: input.fromWarehouseId } },
        });
        const currentQty = originItem?.quantity ?? 0;
        if (currentQty < input.quantity) {
          throw new Error(`Stock insuficiente: hay ${currentQty} ${product.unit} en el almacén de origen`);
        }

        // Restar del origen
        await tx.inventoryItem.upsert({
          where: { productId_warehouseId: { productId: input.productId, warehouseId: input.fromWarehouseId } },
          update: { quantity: { decrement: input.quantity } },
          create: { productId: input.productId, warehouseId: input.fromWarehouseId, quantity: 0 },
        });
      }

      // Sumar al destino si aplica
      if (input.toWarehouseId) {
        await tx.inventoryItem.upsert({
          where: { productId_warehouseId: { productId: input.productId, warehouseId: input.toWarehouseId } },
          update: { quantity: { increment: input.quantity } },
          create: { productId: input.productId, warehouseId: input.toWarehouseId, quantity: input.quantity },
        });
      }

      // Registrar movimiento
      await tx.stockMovement.create({
        data: {
          type: input.type,
          productId: input.productId,
          fromWarehouseId: input.fromWarehouseId ?? null,
          toWarehouseId: input.toWarehouseId ?? null,
          quantity: input.quantity,
          reason: input.reason ?? null,
          notes: input.notes ?? null,
          createdById: userId,
        },
      });
    });

    revalidatePath("/inventory");
    revalidatePath("/movements");
    revalidatePath("/dashboard");
    return { success: true as const };
  } catch (e: any) {
    return { success: false as const, error: e.message ?? "Error al registrar movimiento" };
  }
}

export async function getMovements(filters?: {
  organizationId?: string;
  type?: MovementType;
  productId?: string;
  warehouseId?: string;
  from?: Date;
  to?: Date;
}) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: "No autorizado" };

  const userRole = (session.user as any).role as string;
  const userOrgId = (session.user as any).organizationId as string;
  const userId = (session.user as any).id as string;

  const orgId = filters?.organizationId ?? userOrgId;

  // USER_ESSITY solo ve sus propios movimientos
  const createdByFilter = userRole !== "ADMIN_GI" ? { createdById: userId } : {};

  const movements = await prisma.stockMovement.findMany({
    where: {
      ...createdByFilter,
      product: { organizationId: orgId },
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.productId ? { productId: filters.productId } : {}),
      ...(filters?.from || filters?.to
        ? { createdAt: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } }
        : {}),
    },
    include: {
      product: { select: { name: true, unit: true, sku: true } },
      fromWarehouse: { select: { name: true } },
      toWarehouse: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return { success: true as const, data: movements };
}
