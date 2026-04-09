// src/app/(app)/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { getInventorySummary } from "@/app/actions/inventory";
import { getMovements } from "@/app/actions/movements";
import { DashboardChart } from "@/components/dashboard-chart";
import { Package, ArrowLeftRight, AlertTriangle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function DashboardPage() {
  const session = await auth();
  const userOrgId = (session?.user as any)?.organizationId as string;
  const userRole = (session?.user as any)?.role as string;
  const userName = session?.user?.name ?? "Usuario";

  const [summaryRes, movementsRes] = await Promise.all([
    getInventorySummary(userOrgId),
    getMovements(),
  ]);

  const summary = summaryRes.success ? summaryRes.data : { totalProducts: 0, totalStock: 0, lowStockCount: 0 };
  const recentMovements = movementsRes.success ? movementsRes.data.slice(0, 5) : [];
  const allMovements = movementsRes.success ? movementsRes.data : [];

  // Datos para gráfica: movimientos por tipo
  const chartData = ["ENTRY", "EXIT", "TRANSFER", "RETURN"].map((type) => ({
    name: { ENTRY: "Entrada", EXIT: "Salida", TRANSFER: "Transfer.", RETURN: "Devolución" }[type] ?? type,
    cantidad: allMovements.filter((m) => m.type === type).length,
  }));

  const stats = [
    { label: "Productos", value: summary.totalProducts, icon: Package, color: "text-blue-600 bg-blue-50" },
    { label: "Unidades en stock", value: summary.totalStock, icon: TrendingUp, color: "text-green-600 bg-green-50" },
    { label: "Stock bajo (≤5)", value: summary.lowStockCount, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
    { label: "Movimientos totales", value: allMovements.length, icon: ArrowLeftRight, color: "text-indigo-600 bg-indigo-50" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Bienvenido, {userName}</h1>
        <p className="text-slate-500 text-sm mt-1">Resumen de inventario de promocionales</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${s.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Movimientos por tipo</h2>
          <DashboardChart data={chartData} />
        </div>

        {/* Últimos movimientos */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Últimos movimientos</h2>
          <div className="space-y-3">
            {recentMovements.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-800">{(m as any).product.name}</p>
                  <p className="text-xs text-slate-400">
                    {(m as any).type} · {format(new Date(m.createdAt), "dd MMM HH:mm", { locale: es })}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-700">{m.quantity} uds.</span>
              </div>
            ))}
            {recentMovements.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">Sin movimientos aún</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
