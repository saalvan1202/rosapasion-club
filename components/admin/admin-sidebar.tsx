"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Store,
  Sparkles,
  QrCode,
  Layers,
  CreditCard,
  History,
  Receipt,
  Users,
} from "lucide-react";
import { useAdminNotifications } from "./admin-notification-context";

export function AdminSidebar() {
  const pathname = usePathname();
  const { pendingCount } = useAdminNotifications();

  const navItems = [
    { label: "Inicio", href: "/admin", icon: Home },
    { label: "Comercios Aliados", href: "/admin/businesses", icon: Store },
    { label: "Beneficios", href: "/admin/benefits", icon: Sparkles },
    { label: "Pagos & Yape", href: "/admin/payments", icon: Receipt },
    { label: "Suscripciones", href: "/admin/subscriptions", icon: Users },
    { label: "Categorías & Rubros", href: "/admin/categories", icon: Layers },
    { label: "Historial de Canjes", href: "/admin/history", icon: History },
    { label: "Configuración QR", href: "/admin/settings", icon: QrCode },
  ];

  return (
    <aside className="w-full md:w-56 bg-[#0D0D0D] text-white flex flex-col justify-between flex-shrink-0 shadow-lg border-b md:border-b-0 md:border-r border-[#8C0303]/40 sticky top-0 z-30 md:static">
      <nav className="p-2 md:p-3 flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-1.5 md:space-y-1 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 md:gap-3 px-3 md:px-3.5 py-2 md:py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? "bg-gradient-to-r from-[#8C0303] to-[#F20519] text-white shadow-md border border-[#F20505]/50 ring-1 ring-[#F20519]/30"
                  : "text-stone-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 ${isActive ? "text-white" : "text-stone-400"}`}
              />
              <span>{item.label}</span>
              {item.href === "/admin/payments" && pendingCount > 0 && (
                <span className="ml-auto bg-[#F20519] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse border border-white/20">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer in sidebar (solo en pantallas medianas y grandes) */}
      <div className="hidden md:block p-4 text-[10px] text-stone-400 border-t border-[#8C0303]/30">
        <p className="font-semibold text-stone-300">Rosa Pasión CMS</p>
        <p>Panel Administrativo v1.0</p>
      </div>
    </aside>
  );
}
