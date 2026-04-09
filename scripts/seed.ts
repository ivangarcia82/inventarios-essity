// scripts/seed.ts
import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Organizaciones
  const gi = await prisma.organization.upsert({
    where: { slug: "generando-ideas" },
    update: {},
    create: { name: "Generando Ideas", slug: "generando-ideas" },
  });
  console.log("✅ Organización GI:", gi.name);

  const essity = await prisma.organization.upsert({
    where: { slug: "essity" },
    update: {},
    create: { name: "Essity", slug: "essity" },
  });
  console.log("✅ Organización Essity:", essity.name);

  // Almacenes GI
  const giAlmacen = await prisma.warehouse.upsert({
    where: { name_organizationId: { name: "Almacén Central GI", organizationId: gi.id } },
    update: {},
    create: { name: "Almacén Central GI", organizationId: gi.id },
  });
  console.log("✅ Almacén GI:", giAlmacen.name);

  // Almacenes Essity
  const essityCDMX = await prisma.warehouse.upsert({
    where: { name_organizationId: { name: "Oficina CDMX", organizationId: essity.id } },
    update: {},
    create: { name: "Oficina CDMX", organizationId: essity.id },
  });
  const essityMTY = await prisma.warehouse.upsert({
    where: { name_organizationId: { name: "Oficina Monterrey", organizationId: essity.id } },
    update: {},
    create: { name: "Oficina Monterrey", organizationId: essity.id },
  });
  console.log("✅ Almacenes Essity:", essityCDMX.name, "|", essityMTY.name);

  // Usuario Admin GI
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@generandoideas.com" },
    update: {},
    create: {
      email: "admin@generandoideas.com",
      password: adminPassword,
      name: "Administrador GI",
      role: "ADMIN_GI",
      organizationId: gi.id,
    },
  });
  console.log("✅ Usuario admin:", admin.email);

  // Usuario demo Essity
  const essityPassword = await bcrypt.hash("essity123", 10);
  const essityUser = await prisma.user.upsert({
    where: { email: "usuario@essity.com" },
    update: {},
    create: {
      email: "usuario@essity.com",
      password: essityPassword,
      name: "Usuario Essity Demo",
      role: "USER_ESSITY",
      organizationId: essity.id,
    },
  });
  console.log("✅ Usuario Essity:", essityUser.email);

  console.log("\n📋 Credenciales:");
  console.log("   Admin GI:     admin@generandoideas.com / admin123");
  console.log("   Usuario Essity: usuario@essity.com / essity123");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
