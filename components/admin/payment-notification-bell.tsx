"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Eye,
  Clock,
  Sparkles,
} from "lucide-react";
import { useAdminNotifications } from "./admin-notification-context";

export function PaymentNotificationBell() {
  const router = useRouter();
  const { pendingCount, pendingPayments } = useAdminNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectPayment = (paymentId: string) => {
    setIsOpen(false);
    router.push(`/admin/payments?inspect=${paymentId}`);
  };

  const getMethodBadge = (method: string) => {
    if (method === "YAPE") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#742384] text-white">
          <span>🟣</span> Yape
        </span>
      );
    }
    if (method === "PLIN") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#00B4D8] text-white">
          <span>🔵</span> Plin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
        <span>🏛️</span> Transferencia
      </span>
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Botón Campana Notificación */}
      {pendingCount > 0 ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={`Tienes ${pendingCount} ${
            pendingCount === 1 ? "pago pendiente" : "pagos pendientes"
          } por revisar`}
          className="flex items-center gap-2 text-xs font-bold text-amber-200 bg-gradient-to-r from-amber-950/90 via-[#451804] to-amber-950/90 hover:brightness-110 border border-amber-400/70 px-3 py-1.5 rounded-full transition-all shadow-[0_0_14px_rgba(245,158,11,0.4)] cursor-pointer"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300"></span>
          </span>
          <Bell className="w-3.5 h-3.5 text-amber-300" />
          <span className="font-mono">
            {pendingCount} {pendingCount === 1 ? "Pago Nuevo" : "Pagos Nuevos"}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title="No hay pagos pendientes de revisión"
          className="hidden sm:flex items-center gap-1.5 text-xs text-stone-300 hover:text-white bg-[#3B070D]/70 hover:bg-[#3B070D] px-2.5 py-1.5 rounded-full border border-white/10 transition-all cursor-pointer"
        >
          <Bell className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-[11px] text-stone-400">Pagos al día</span>
        </button>
      )}

      {/* Menú Desplegable con Lista de Pagos */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 text-stone-900 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Cabecera del Dropdown */}
          <div className="bg-gradient-to-r from-[#4A0A10] to-[#2E050B] text-white px-4 py-3 flex items-center justify-between border-b border-[#D4AF37]/30">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <span className="font-serif font-bold text-xs tracking-wide">
                Nuevos Pagos Recibidos
              </span>
            </div>
            {pendingCount > 0 && (
              <span className="bg-amber-400 text-[#2B050B] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {pendingCount} pendientes
              </span>
            )}
          </div>

          {/* Contenido / Lista */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-stone-100">
            {pendingCount === 0 || pendingPayments.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-stone-800">
                  ¡Excelente! No hay pagos pendientes
                </p>
                <p className="text-[11px] text-stone-500">
                  Todos los comprobantes de renovación han sido revisados y procesados.
                </p>
              </div>
            ) : (
              pendingPayments.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPayment(p.id)}
                  className="p-3.5 hover:bg-amber-50/70 transition cursor-pointer flex items-center gap-3 group"
                >
                  {/* Vista previa o icono */}
                  <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                    {p.voucherUrl ? (
                      <img
                        src={p.voucherUrl}
                        alt="Voucher"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Eye className="w-5 h-5 text-stone-400" />
                    )}
                  </div>

                  {/* Información del Socio */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs text-stone-900 truncate">
                        {p.memberName}
                      </span>
                      <span className="font-mono font-bold text-xs text-emerald-700 flex-shrink-0">
                        S/ {p.amount.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mb-1">
                      <span>DNI: {p.documentNumber}</span>
                      <span>•</span>
                      <span className="font-mono">{p.memberCode}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      {getMethodBadge(p.paymentMethod)}
                      <span className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(p.createdAt).toLocaleTimeString("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition flex-shrink-0" />
                </div>
              ))
            )}
          </div>

          {/* Pie del Dropdown */}
          <div className="p-2.5 bg-stone-50 border-t border-stone-100 text-center">
            <Link
              href="/admin/payments"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-[#4A0A10] hover:text-[#7A121D] flex items-center justify-center gap-1 transition"
            >
              <span>Ir al módulo completo de pagos</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
