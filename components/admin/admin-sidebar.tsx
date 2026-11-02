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
    <aside className="w-full md:w-56 bg-[#3F050D] text-white flex flex-col justify-between flex-shrink-0 shadow-lg border-b md:border-b-0 md:border-r border-[#2F0308] sticky top-0 z-30 md:static">
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
                  ? "bg-[#580A15] text-white shadow-sm border border-[#D4AF37]/40 ring-1 ring-[#D4AF37]/20"
                  : "text-stone-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 ${isActive ? "text-[#D4AF37]" : "text-stone-400"}`}
              />
              <span>{item.label}</span>
              {item.href === "/admin/payments" && pendingCount > 0 && (
                <span className="ml-auto bg-amber-400 text-[#2B050B] text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer in sidebar (solo en pantallas medianas y grandes) */}
      <div className="hidden md:block p-4 text-[10px] text-stone-400 border-t border-white/5">
        <p className="font-semibold text-stone-300">Rosa Pasión CMS</p>
        <p>Panel Administrativo v1.0</p>
      </div>
    </aside>
  );
}
