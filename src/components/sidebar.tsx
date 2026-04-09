// src/components/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard, Package, ArrowLeftRight, Warehouse,
  Users, ShoppingCart, ChevronLeft, ChevronRight, LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inventario", href: "/inventory", icon: Package },
  { label: "Movimientos", href: "/movements", icon: ArrowLeftRight },
  { label: "Registrar Movimiento", href: "/movements/new", icon: ShoppingCart },
];

const adminItems = [
  { label: "Almacenes", href: "/admin/warehouses", icon: Warehouse },
  { label: "Productos", href: "/admin/products", icon: Package },
  { label: "Usuarios", href: "/admin/users", icon: Users },
];

interface SidebarProps {
  userName: string;
  userRole: string;
  orgName: string;
}

export function Sidebar({ userName, userRole, orgName }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = userRole === "ADMIN_GI";

  return (
    <aside className={`flex flex-col h-screen bg-slate-900 text-white border-r border-slate-800 transition-all duration-300 ${collapsed ? "w-[68px]" : "w-[240px]"}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shrink-0">
          <Package className="w-5 h-5 text-white" />
        </div>
        {!collapsed && <span className="font-bold text-sm tracking-tight whitespace-nowrap">Inventario Promo</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            {!collapsed && <p className="text-xs text-slate-500 uppercase px-3 pt-4 pb-1 font-semibold tracking-wider">Admin</p>}
            {adminItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-3 space-y-2">
        {!collapsed && (
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-slate-400 truncate">{orgName}</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-sm transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Colapsar</span>}
        </button>
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-400 hover:bg-red-900/40 hover:text-red-400 text-sm transition-colors">
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
