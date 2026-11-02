"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  MessageCircle,
  Eye,
  Filter,
  CreditCard,
  User,
  Phone,
  FileText,
  X,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { approvePayment, rejectPayment } from "@/actions/payment";

export interface PaymentItem {
  id: string;
  memberId?: string | null;
  memberCode: string;
  memberName: string;
  documentNumber: string;
  phone: string;
  planName: string;
  amount: number;
  paymentMethod: string;
  operationNumber?: string | null;
  voucherUrl?: string | null;
  status: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  notes?: string | null;
  approvedAt?: Date | string | null;
  approvedBy?: string | null;
  rejectedReason?: string | null;
  createdAt: Date | string;
  member?: {
    id: string;
    code: string;
    name: string;
    validUntil: Date | string;
    status: string;
  } | null;
}

interface PaymentManagerProps {
  initialPayments: PaymentItem[];
}

export function PaymentManager({ initialPayments }: PaymentManagerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inspectId = searchParams.get("inspect") || searchParams.get("view");
  const [highlightedPaymentId, setHighlightedPaymentId] = useState<string | null>(null);
  const [inspectingPayment, setInspectingPayment] = useState<PaymentItem | null>(null);

  const [payments, setPayments] = useState<PaymentItem[]>(initialPayments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedVoucherUrl, setSelectedVoucherUrl] = useState<string | null>(null);

  // Detectar parámetro ?inspect=id para abrir directamente el modal y resaltar la fila
  useEffect(() => {
    if (inspectId) {
      const target = payments.find((p) => p.id === inspectId);
      if (target) {
        setHighlightedPaymentId(inspectId);
        setInspectingPayment(target);
        setTimeout(() => {
          const el = document.getElementById(`payment-row-${inspectId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 150);
      }
    }
  }, [inspectId, payments]);

  const handleCloseInspect = () => {
    setInspectingPayment(null);
    router.replace("/admin/payments");
  };

  // Modal para confirmar aprobación propio del sistema
  const [approvingPayment, setApprovingPayment] = useState<PaymentItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal para rechazar con motivo
  const [rejectingPayment, setRejectingPayment] = useState<PaymentItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Modal de éxito de aprobación con enlace WhatsApp
  const [approvedSuccess, setApprovedSuccess] = useState<{
    memberName: string;
    whatsappUrl: string;
  } | null>(null);

  // Modal de notificación WhatsApp tras rechazo
  const [rejectedSuccess, setRejectedSuccess] = useState<{
    memberName: string;
    whatsappUrl: string;
    reason: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const filteredPayments = payments.filter((p) => {
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.memberName.toLowerCase().includes(q) ||
      p.documentNumber.toLowerCase().includes(q) ||
      p.memberCode.toLowerCase().includes(q) ||
      (p.operationNumber && p.operationNumber.toLowerCase().includes(q)) ||
      p.phone.includes(q);

    return matchesStatus && matchesSearch;
  });

  const pendingCount = payments.filter((p) => p.status === "PENDIENTE").length;
  const approvedCount = payments.filter((p) => p.status === "APROBADO").length;
  const rejectedCount = payments.filter((p) => p.status === "RECHAZADO").length;

  const handleOpenApprove = (payment: PaymentItem) => {
    setActionError(null);
    setApprovingPayment(payment);
  };

  const handleConfirmApprove = async () => {
    if (!approvingPayment) return;
    setActionError(null);

    startTransition(async () => {
      const res = await approvePayment(approvingPayment.id);
      if (res.success) {
        setPayments((prev) =>
          prev.map((item) =>
            item.id === approvingPayment.id
              ? {
                  ...item,
                  status: "APROBADO",
                  approvedAt: new Date(),
                  approvedBy: "Admin",
                }
              : item
          )
        );

        const waData = {
          memberName: approvingPayment.memberName,
          whatsappUrl: res.whatsappNotifyUrl || "",
        };
        setApprovingPayment(null);

        if (waData.whatsappUrl) {
          setApprovedSuccess(waData);
        }
      } else {
        setActionError(res.message || "Error al aprobar el pago");
      }
    });
  };

  const handleOpenReject = (payment: PaymentItem) => {
    setActionError(null);
    setRejectReason("");
    setRejectingPayment(payment);
  };

  const handleConfirmReject = async () => {
    if (!rejectingPayment) return;
    if (!rejectReason.trim()) {
      setActionError("Por favor escribe el motivo del rechazo.");
      return;
    }
    setActionError(null);

    startTransition(async () => {
      const res = await rejectPayment(rejectingPayment.id, rejectReason);
      if (res.success) {
        setPayments((prev) =>
          prev.map((item) =>
            item.id === rejectingPayment.id
              ? { ...item, status: "RECHAZADO", rejectedReason: rejectReason }
              : item
          )
        );

        const waData = {
          memberName: rejectingPayment.memberName,
          whatsappUrl: res.whatsappRejectUrl || "",
          reason: rejectReason,
        };

        setRejectingPayment(null);
        setRejectReason("");

        if (waData.whatsappUrl) {
          setRejectedSuccess(waData);
        }
      } else {
        setActionError(res.message || "Error al rechazar comprobante");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Pagos & Renovaciones (Yape / Plin)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Aprobación manual de comprobantes sin comisiones de pasarela
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold shadow-xs animate-pulse">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{pendingCount} comprobante{pendingCount === 1 ? "" : "s"} pendiente{pendingCount === 1 ? "" : "s"} de validación</span>
          </div>
        )}
      </div>

      {/* Tabs de Filtro de Estado */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            statusFilter === "ALL"
              ? "bg-[#4A0A10] text-white shadow-sm"
              : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
          }`}
        >
          <span>Todos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
            {payments.length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("PENDIENTE")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            statusFilter === "PENDIENTE"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-50"
          }`}
        >
          <span>Pendientes</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900">
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("APROBADO")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            statusFilter === "APROBADO"
              ? "bg-emerald-700 text-white shadow-sm"
              : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50"
          }`}
        >
          <span>Aprobados</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-900">
            {approvedCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("RECHAZADO")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            statusFilter === "RECHAZADO"
              ? "bg-red-700 text-white shadow-sm"
              : "bg-white text-red-800 border border-red-200 hover:bg-red-50"
          }`}
        >
          <span>Rechazados</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-100 text-red-900">
            {rejectedCount}
          </span>
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder=""
          className="w-full text-xs text-stone-800 placeholder-stone-400 focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-stone-400 hover:text-stone-600 text-xs font-medium cursor-pointer"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* LISTA RESPONSIVE DE COMPROBANTES */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        {/* VISTA MÓVIL (< 768px) */}
        <div className="block md:hidden divide-y divide-stone-100">
          {filteredPayments.length > 0 ? (
            filteredPayments.map((p) => {
              const formattedDate = new Date(p.createdAt).toLocaleDateString("es-PE", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={p.id}
                  id={`payment-row-${p.id}`}
                  className={`p-4 space-y-3 transition-all duration-300 ${
                    highlightedPaymentId === p.id
                      ? "bg-amber-100/90 ring-2 ring-amber-500 rounded-2xl shadow-md"
                      : "hover:bg-stone-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                        p.status === "PENDIENTE"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : p.status === "APROBADO"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-red-100 text-red-800 border border-red-300"
                      }`}
                    >
                      {p.status}
                    </span>

                    <span className="text-[11px] text-stone-400">{formattedDate}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">{p.memberName}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-1">
                      <span className="font-mono font-semibold bg-stone-100 px-1.5 py-0.5 rounded text-[11px]">
                        DNI: {p.documentNumber}
                      </span>
                      <span className="font-mono text-[11px] text-[#4A0A10] font-bold">
                        {p.memberCode}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Phone className="w-3 h-3 text-stone-400" />
                        {p.phone}
                      </span>
                    </div>
                  </div>

                  {/* Datos del Pago */}
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#4A0A10] font-mono text-sm">
                        S/ {p.amount.toFixed(2)}
                      </span>
                      <span className="text-stone-500 ml-1.5 font-medium text-[11px]">
                        ({p.paymentMethod})
                      </span>
                      {p.operationNumber && (
                        <p className="text-[10px] font-mono text-stone-500 mt-0.5">
                          Op: #{p.operationNumber}
                        </p>
                      )}
                    </div>

                    {p.voucherUrl && (
                      <button
                        type="button"
                        onClick={() => setSelectedVoucherUrl(p.voucherUrl || null)}
                        className="px-2.5 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver Voucher</span>
                      </button>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setInspectingPayment(p)}
                      className="py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-700" />
                      <span>Revisar</span>
                    </button>

                    {p.status === "PENDIENTE" && (
                      <>
                        <button
                          onClick={() => handleOpenApprove(p)}
                          disabled={isPending}
                          className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Aprobar</span>
                        </button>
                        <button
                          onClick={() => handleOpenReject(p)}
                          disabled={isPending}
                          className="py-2 px-2.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs transition cursor-pointer"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-stone-400 text-xs">
              No hay comprobantes de pago que coincidan con la búsqueda.
            </div>
          )}
        </div>

        {/* VISTA DESKTOP (>= 768px) */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[700px] sm:min-w-full">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-700 font-semibold">
                <th className="py-3 px-4 uppercase tracking-wider text-[11px]">Fecha</th>
                <th className="py-3 px-6 uppercase tracking-wider text-[11px]">Socio / Titular</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px]">Monto & Método</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px]">N° Operación</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px]">Voucher</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px]">Estado</th>
                <th className="py-3 px-6 text-right uppercase tracking-wider text-[11px]">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((p) => {
                  const formattedDate = new Date(p.createdAt).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={p.id}
                      id={`payment-row-${p.id}`}
                      className={`transition-all duration-300 ${
                        highlightedPaymentId === p.id
                          ? "bg-amber-100/90 ring-2 ring-amber-500 font-semibold shadow-xs"
                          : "hover:bg-stone-50/80"
                      }`}
                    >
                      <td className="py-3.5 px-4 text-stone-500 whitespace-nowrap text-[11px]">
                        {formattedDate}
                      </td>

                      <td className="py-3.5 px-6">
                        <p className="font-bold text-stone-900 text-sm leading-tight">
                          {p.memberName}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                          <span className="font-mono bg-stone-100 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                            DNI: {p.documentNumber}
                          </span>
                          <span className="font-mono text-[#4A0A10] font-bold text-[10px]">
                            {p.memberCode}
                          </span>
                          <span>• {p.phone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                        <span className="text-sm">S/ {p.amount.toFixed(2)}</span>
                        <span className="block text-[10px] text-stone-500 font-sans font-medium">
                          {p.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-stone-700">
                        {p.operationNumber || <span className="text-stone-300">—</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        {p.voucherUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedVoucherUrl(p.voucherUrl || null)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[#4A0A10] font-semibold text-[11px] border border-stone-200 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Voucher</span>
                          </button>
                        ) : (
                          <span className="text-stone-300 text-[11px]">Sin captura</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                            p.status === "PENDIENTE"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : p.status === "APROBADO"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-red-100 text-red-800 border border-red-300"
                          }`}
                        >
                          {p.status}
                        </span>
                        {p.status === "APROBADO" && p.approvedBy && (
                          <span className="block text-[9px] text-stone-400 mt-0.5">
                            Por {p.approvedBy}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-6 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setInspectingPayment(p)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-xs transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-700" />
                          <span>Revisar</span>
                        </button>

                        {p.status === "PENDIENTE" ? (
                          <>
                            <button
                              onClick={() => handleOpenApprove(p)}
                              disabled={isPending}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleOpenReject(p)}
                              disabled={isPending}
                              className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </>
                        ) : p.status === "APROBADO" ? (
                          <span className="text-emerald-700 text-xs font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Membresía Activa</span>
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs italic">
                            {p.rejectedReason || "Rechazado"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400 text-xs">
                    No se encontraron comprobantes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL COMPLETO DE REVISIÓN Y VALIDACIÓN DEL PAGO */}
      {inspectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop: No se cierra al hacer clic afuera */}
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            {/* Cabecera */}
            <div className="flex-shrink-0 bg-gradient-to-r from-[#4A0A10] to-[#2E050B] text-white px-5 py-4 flex items-center justify-between border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-white">
                    Revisión de Pago de Renovación
                  </h3>
                  <p className="text-[11px] text-[#F7EDC4]/80">
                    Socio: {inspectingPayment.memberName} • {inspectingPayment.memberCode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    inspectingPayment.status === "PENDIENTE"
                      ? "bg-amber-400 text-stone-950"
                      : inspectingPayment.status === "APROBADO"
                      ? "bg-emerald-400 text-stone-950"
                      : "bg-red-400 text-stone-950"
                  }`}
                >
                  {inspectingPayment.status}
                </span>

                <button
                  onClick={handleCloseInspect}
                  className="p-1.5 rounded-full text-stone-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cuerpo del Modal (2 Columnas en Desktop) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lado 1: Comprobante de Pago */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#4A0A10]" />
                    Captura del Comprobante
                  </span>
                  {inspectingPayment.voucherUrl && (
                    <button
                      type="button"
                      onClick={() => setSelectedVoucherUrl(inspectingPayment.voucherUrl || null)}
                      className="text-[11px] text-[#4A0A10] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ampliar Pantalla Completa</span>
                    </button>
                  )}
                </div>

                <div className="rounded-2xl bg-stone-100 border-2 border-dashed border-stone-200 p-2 flex items-center justify-center min-h-[260px] max-h-[420px] overflow-hidden">
                  {inspectingPayment.voucherUrl ? (
                    <img
                      src={inspectingPayment.voucherUrl}
                      alt="Comprobante de pago"
                      className="w-full h-auto max-h-[400px] object-contain rounded-xl shadow-xs cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={() => setSelectedVoucherUrl(inspectingPayment.voucherUrl || null)}
                      title="Haz clic para ampliar"
                    />
                  ) : (
                    <div className="text-center p-6 text-stone-400 space-y-2">
                      <FileText className="w-10 h-10 mx-auto text-stone-300" />
                      <p className="text-xs">No se adjuntó comprobante de imagen</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Lado 2: Datos del Socio y de la Transacción */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2.5 text-xs">
                    <h4 className="font-bold text-stone-900 border-b pb-2 flex items-center justify-between">
                      <span>Información del Socio</span>
                      <span className="font-mono text-[#4A0A10] font-extrabold bg-[#4A0A10]/10 px-2 py-0.5 rounded">
                        {inspectingPayment.memberCode}
                      </span>
                    </h4>

                    <div className="flex justify-between py-0.5">
                      <span className="text-stone-500">Nombre Titular:</span>
                      <strong className="text-stone-900 text-right">{inspectingPayment.memberName}</strong>
                    </div>

                    <div className="flex justify-between py-0.5">
                      <span className="text-stone-500">DNI / Documento:</span>
                      <strong className="font-mono text-stone-900">{inspectingPayment.documentNumber}</strong>
                    </div>

                    <div className="flex justify-between py-0.5 items-center">
                      <span className="text-stone-500">Celular / WhatsApp:</span>
                      <a
                        href={`https://wa.me/${inspectingPayment.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 underline"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{inspectingPayment.phone}</span>
                      </a>
                    </div>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2.5 text-xs">
                    <h4 className="font-bold text-amber-950 border-b border-amber-200 pb-2 flex items-center justify-between">
                      <span>Detalles de la Operación</span>
                      <span className="font-mono text-emerald-800 font-extrabold text-sm">
                        S/ {inspectingPayment.amount.toFixed(2)}
                      </span>
                    </h4>

                    <div className="flex justify-between py-0.5">
                      <span className="text-stone-600">Método de Pago:</span>
                      <span className="font-bold text-stone-900">{inspectingPayment.paymentMethod}</span>
                    </div>

                    <div className="flex justify-between py-0.5">
                      <span className="text-stone-600">N° de Operación:</span>
                      <strong className="font-mono text-stone-900">
                        {inspectingPayment.operationNumber || "No especificado"}
                      </strong>
                    </div>

                    <div className="flex justify-between py-0.5">
                      <span className="text-stone-600">Fecha de Recepción:</span>
                      <span className="text-stone-700">
                        {new Date(inspectingPayment.createdAt).toLocaleString("es-PE", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    {inspectingPayment.notes && (
                      <div className="pt-2 border-t border-amber-200/60">
                        <span className="text-stone-500 text-[11px] block">Notas:</span>
                        <p className="text-stone-700 text-[11px] italic mt-0.5">
                          {inspectingPayment.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones si está pendiente */}
                {inspectingPayment.status === "PENDIENTE" ? (
                  <div className="space-y-2 pt-2 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={() => {
                        const target = inspectingPayment;
                        setInspectingPayment(null);
                        handleOpenApprove(target);
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aprobar Pago y Activar Socio (30 días)</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const target = inspectingPayment;
                          setInspectingPayment(null);
                          handleOpenReject(target);
                        }}
                        className="py-2.5 px-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Rechazar Pago</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCloseInspect}
                        className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleCloseInspect}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer"
                  >
                    Cerrar Detalle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA VER VOUCHER EN ALTA RESOLUCIÓN */}
      {selectedVoucherUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop: No se cierra al hacer clic afuera */}
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-4 shadow-2xl z-10 space-y-3 animate-in zoom-in-95 border border-stone-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#4A0A10]" />
                <span>Captura del Comprobante</span>
              </h4>
              <button
                onClick={() => setSelectedVoucherUrl(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-800 transition cursor-pointer hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto rounded-xl bg-stone-100 flex items-center justify-center p-2">
              <img
                src={selectedVoucherUrl}
                alt="Comprobante de pago"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROPIO DEL SISTEMA PARA CONFIRMAR APROBACIÓN */}
      {approvingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop: No se cierra al hacer clic afuera */}
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-stone-900">
                  Confirmar Aprobación de Pago
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setApprovingPayment(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Socio:</span>
                <span className="font-bold text-stone-900">{approvingPayment.memberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Código de Socio:</span>
                <span className="font-mono font-bold text-stone-900">{approvingPayment.memberCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">DNI / Documento:</span>
                <span className="font-mono text-stone-900">{approvingPayment.documentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Método de Pago:</span>
                <span className="font-bold text-purple-700">{approvingPayment.paymentMethod}</span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-2 text-sm">
                <span className="font-bold text-stone-700">Monto Oficial:</span>
                <span className="font-mono font-bold text-emerald-700">
                  S/ {approvingPayment.amount.toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              ¿Deseas validar este pago y extender la vigencia de la membresía por <strong>30 días adicionales</strong> para este socio?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setApprovingPayment(null)}
                className="px-4 py-2.5 rounded-xl text-xs text-stone-600 hover:bg-stone-100 font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "Aprobando..." : "Sí, Aprobar y Activar Membresía"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA RECHAZAR CON MOTIVO */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop: No se cierra al hacer clic afuera */}
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 border border-stone-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-sm text-stone-900">
                Rechazar Comprobante de {rejectingPayment.memberName}
              </h4>
              <button
                type="button"
                onClick={() => setRejectingPayment(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Motivo del rechazo
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder=""
                className="w-full border border-stone-300 rounded-xl p-2.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#4A0A10]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingPayment(null)}
                className="px-4 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-100 font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isPending}
                className="px-4 py-2 rounded-xl text-xs bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50 cursor-pointer"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ÉXITO DE APROBACIÓN CON BOTÓN DE NOTIFICACIÓN WHATSAPP */}
      {approvedSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop: No se cierra al hacer clic afuera */}
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl z-10 text-center space-y-4 animate-in zoom-in-95 border border-stone-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="font-bold text-base text-stone-900">
                ¡Membresía Activada por 30 Días!
              </h4>
              <p className="text-xs text-stone-500 mt-1">
                El pago de <strong>{approvedSuccess.memberName}</strong> fue aprobado. Puedes enviarle la confirmación automática por WhatsApp con 1 clic:
              </p>
            </div>

            <a
              href={approvedSuccess.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setApprovedSuccess(null)}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Notificar al Socio por WhatsApp ⚡</span>
            </a>

            <button
              onClick={() => setApprovedSuccess(null)}
              className="text-xs text-stone-400 hover:text-stone-600 underline cursor-pointer"
            >
              Listo, continuar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN PARA NOTIFICAR RECHAZO POR WHATSAPP */}
      {rejectedSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop: No se cierra al hacer clic afuera */}
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl z-10 text-center space-y-4 animate-in zoom-in-95 border border-stone-200">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <h4 className="font-bold text-base text-stone-900">
                Comprobante Rechazado
              </h4>
              <p className="text-xs text-stone-500 mt-1">
                El comprobante de <strong>{rejectedSuccess.memberName}</strong> fue marcado como rechazado.
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-left text-xs">
              <span className="font-bold text-stone-600 block text-[10px] uppercase tracking-wider mb-0.5">
                Motivo del rechazo registrado:
              </span>
              <p className="text-stone-800 italic">{rejectedSuccess.reason}</p>
            </div>

            <p className="text-xs text-stone-600">
              ¿Deseas enviar un WhatsApp al socio con el motivo del rechazo para que pueda reenviarlo o corregirlo?
            </p>

            <div className="space-y-2 pt-1">
              <a
                href={rejectedSuccess.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setRejectedSuccess(null)}
                className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Notificación por WhatsApp 📲</span>
              </a>

              <button
                type="button"
                onClick={() => setRejectedSuccess(null)}
                className="w-full py-2 text-xs text-stone-400 hover:text-stone-600 underline cursor-pointer"
              >
                Omitir y no notificar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
