import React from "react";
import prisma from "@/lib/prisma";
import { getPendingPaymentsCount } from "@/actions/payment";
import Link from "next/link";
import {
  Store,
  Layers,
  CreditCard,
  History,
  QrCode,
  Plus,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Sparkles,
  Receipt,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let totalBusinesses = 0;
  let activeBusinesses = 0;
  let totalCategories = 0;
  let totalMembers = 0;
  let activeMembers = 0;
  let totalHistory = 0;
  let recentLogs: any[] = [];
  let pendingPaymentsCount = 0;
  let settings = {
    catalogUrl: "https://wa.me/51952226282",
    qrRedirectUrl: "https://rosapasionclub.com",
    supportPhone: "51952226282",
  };

  try {
    const [
      bizCount,
      activeBizCount,
      catCount,
      memberCount,
      activeMemCount,
      historyCount,
      pendingPayCount,
      fetchedLogs,
      clubSettings,
    ] = await Promise.all([
      // Métricas y conteos actualizados con soft-delete y pagos
      prisma.business.count({ where: { deletedAt: null } as any }),
      prisma.business.count({ where: { isActive: true, deletedAt: null } as any }),
      prisma.category.count(),
      prisma.member.count({ where: { deletedAt: null } as any }),
      prisma.member.count({ where: { status: "ACTIVA", deletedAt: null } as any }),
      prisma.historyLog.count(),
      getPendingPaymentsCount(),
      prisma.historyLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.clubSetting.findUnique({ where: { id: "default" } }),
    ]);

    totalBusinesses = bizCount;
    activeBusinesses = activeBizCount;
    totalCategories = catCount;
    totalMembers = memberCount;
    activeMembers = activeMemCount;
    totalHistory = historyCount;
    pendingPaymentsCount = pendingPayCount;
    recentLogs = fetchedLogs;
    if (clubSettings) settings = clubSettings;
  } catch (error) {
    console.error("Error al cargar datos del dashboard:", error);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Panel Principal del Club
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Métricas generales, socios con suscripción activa y canjes de beneficios
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/businesses"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4A0A10] hover:bg-[#580A15] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Aliado</span>
          </Link>
          <Link
            href="/admin/subscriptions"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#C59B27] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Nuevo Socio</span>
          </Link>
        </div>
      </div>

      {/* Alerta de Pagos Yape / Plin Pendientes */}
      {pendingPaymentsCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider bg-white/25 px-2 py-0.5 rounded text-white">
                  Nuevos Comprobantes
                </span>
                <span className="text-[11px] text-amber-100 font-medium">Yape / Plin</span>
              </div>
              <h3 className="text-base font-serif font-bold text-white mt-0.5">
                Tienes {pendingPaymentsCount} pago{pendingPaymentsCount === 1 ? "" : "s"} pendiente{pendingPaymentsCount === 1 ? "" : "s"} por validar
              </h3>
            </div>
          </div>

          <Link
            href="/admin/payments"
            className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-white text-stone-900 font-bold text-xs uppercase tracking-wider shadow-md hover:bg-stone-100 active:scale-95 transition flex items-center gap-1.5"
          >
            <span>Revisar y Activar ⚡</span>
          </Link>
        </div>
      )}

      {/* Metric Cards (White cards matching dashboard aesthetic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Comercios Aliados */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-200">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Comercios Aliados
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF2E8] text-[#4A0A10] flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-stone-900">{activeBusinesses}</span>
            <span className="text-xs text-stone-400">/ {totalBusinesses} marcas</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Visibles en portal de socio</span>
          </div>
        </div>

        {/* Suscripciones / Socios */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-200">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Socios Activos
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-stone-900">{activeMembers}</span>
            <span className="text-xs text-stone-400">/ {totalMembers} carnets</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            Membresías con vigencia vigente
          </div>
        </div>

        {/* Historial de Canjes */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-200">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Canjes Realizados
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-stone-900">{totalHistory}</span>
            <span className="text-xs text-stone-400">usos registrados</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            Validaciones en marcas aliadas
          </div>
        </div>

        {/* Categorías */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-200">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Categorías
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-stone-900">{totalCategories}</span>
            <span className="text-xs text-stone-400">rubros</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            Filtros para el portal móvil
          </div>
        </div>
      </div>

      {/* Recent Canjes Feed & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Últimos Canjes */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-stone-200">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
            <h3 className="font-serif font-bold text-base text-stone-900">
              Actividad Reciente de Canjes
            </h3>
            <Link
              href="/admin/history"
              className="text-xs font-semibold text-[#4A0A10] hover:underline"
            >
              Ver todo el historial →
            </Link>
          </div>

          <div className="space-y-3">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-100 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-[10px] bg-[#FAF2E8] border border-[#D4AF37]/30 px-2 py-0.5 rounded text-[#4A0A10]">
                      {log.memberCode}
                    </span>
                    <div>
                      <p className="font-bold text-stone-900">{log.memberName}</p>
                      <p className="text-[11px] text-stone-500">{log.businessName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
                      {log.discountApplied}
                    </span>
                    <p className="text-[10px] text-stone-400 mt-1">
                      {new Date(log.createdAt).toLocaleDateString("es-PE")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-400 text-center py-6">
                No hay canjes registrados recientemente.
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Quick Links */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200 space-y-4">
          <h3 className="font-serif font-bold text-base text-stone-900 pb-2 border-b border-stone-100">
            Accesos Rápidos
          </h3>

          <Link
            href="/admin/subscriptions"
            className="flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:border-[#D4AF37] hover:bg-stone-50 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-[#4A0A10]" />
              <span className="text-xs font-semibold text-stone-800">
                Administrar Suscripciones
              </span>
            </div>
            <span className="text-xs text-stone-400 group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>

          <Link
            href="/admin/benefits"
            className="flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:border-[#D4AF37] hover:bg-stone-50 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-semibold text-stone-800">
                Revisar Beneficios del Club
              </span>
            </div>
            <span className="text-xs text-stone-400 group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>

          <Link
            href="/admin/settings"
            className="flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:border-[#D4AF37] hover:bg-stone-50 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <QrCode className="w-4 h-4 text-[#4A0A10]" />
              <span className="text-xs font-semibold text-stone-800">
                Destino del Código QR Maestro
              </span>
            </div>
            <span className="text-xs text-stone-400 group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>

          <div className="pt-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-[#FAF2E8] hover:bg-[#F3E5AB] text-[#4A0A10] font-bold text-xs flex items-center justify-center gap-2 border border-[#D4AF37]/30 transition-colors"
            >
              <span>Abrir Portal de Socios</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
