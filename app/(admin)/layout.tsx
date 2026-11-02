import React from "react";
import Link from "next/link";
import {
  Home,
  Store,
  Sparkles,
  QrCode,
  CreditCard,
  History,
  LogOut,
  ChevronDown,
  User,
  ExternalLink,
} from "lucide-react";
import { getCurrentAdmin, logoutAction } from "@/actions/auth";
import { getPendingPaymentsList } from "@/actions/payment";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminNotificationProvider } from "@/components/admin/admin-notification-context";
import { PaymentNotificationBell } from "@/components/admin/payment-notification-bell";

export const metadata = {
  title: "Admin CMS | Rosa Pasión Club",
  description: "Panel de control administrativo y gestión de alianzas comerciales",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentAdmin, pendingList] = await Promise.all([
    getCurrentAdmin(),
    getPendingPaymentsList(),
  ]);

  return (
    <AdminNotificationProvider initialCount={pendingList.length} initialList={pendingList}>
      <div className="min-h-screen bg-[#F4F5F7] text-stone-800 flex flex-col font-sans">
        {/* Top Header Bar (Wine / Burgundy) */}
        <header className="w-full bg-[#4A0A10] text-white px-6 py-3.5 flex items-center justify-between shadow-md border-b border-[#D4AF37]/30 z-20">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="bg-white px-2.5 py-1 rounded-xl border border-[#D4AF37]/50 shadow-sm flex items-center transition-all group-hover:scale-105">
                <img
                  src="/logo-horizontal.png"
                  alt="Rosa Pasión"
                  className="h-7 w-auto object-contain"
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F3E5AB] bg-[#3B070D] px-2 py-0.5 rounded-md border border-[#D4AF37]/30">
                CMS Panel
              </span>
            </Link>
          </div>

          {/* User Info & Dropdown */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Campana de Notificaciones de Pagos */}
            <PaymentNotificationBell />

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-[#F3E5AB] hover:underline bg-[#3B070D] px-3 py-1.5 rounded-full border border-[#D4AF37]/30 transition-all"
            >
              <span>Ver Portal Móvil</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-center gap-3 pl-3 border-l border-white/10">
            <div className="w-8 h-8 rounded-full bg-[#CBB191] text-[#4A0A10] flex items-center justify-center font-bold">
              <User className="w-4 h-4 text-[#4A0A10]" />
            </div>
            <div className="hidden sm:block text-left text-xs leading-tight">
              <p className="font-bold text-white">Hola, {currentAdmin?.name || "Admin"}</p>
              <form action={logoutAction} className="inline">
                <button
                  type="submit"
                  className="text-stone-300 hover:text-white underline text-[11px] cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-300 hidden sm:block" />
          </div>
        </div>
      </header>

      {/* Body: Sidebar + Main Content */}
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-61px)]">
        {/* Dynamic Left Sidebar */}
        <AdminSidebar />

        {/* Right Main Content Area (Clean White / Light Gray background) */}
        <main className="flex-1 bg-[#F4F5F7] p-3.5 sm:p-6 md:p-8 min-w-0 overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  </AdminNotificationProvider>
  );
}
