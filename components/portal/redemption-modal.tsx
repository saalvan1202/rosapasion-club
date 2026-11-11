"use client";

import React, { useState, useTransition } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Key,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import { redeemBenefitInStore } from "@/actions/redemption";

interface BusinessOption {
  id: string;
  name: string;
  slug: string;
  discountSummary: string;
  logoUrl?: string | null;
  category: {
    name: string;
  };
}

interface RedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    name: string;
    code: string;
    documentType?: string;
    documentNumber?: string | null;
  };
  businesses?: BusinessOption[];
}

export function RedemptionModal({
  isOpen,
  onClose,
  member,
}: RedemptionModalProps) {
  const [storeCode, setStoreCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = storeCode.trim();
    if (!cleanCode) {
      setError("Por favor ingresa el código del negocio.");
      return;
    }

    startTransition(async () => {
      const res = await redeemBenefitInStore({
        memberCodeOrDoc: member.code || member.documentNumber || "",
        storeCode: cleanCode,
      });

      if (res.success) {
        setSuccessData(res);
      } else {
        setError(res.message || "Código de negocio no válido.");
      }
    });
  };

  const handleResetAndClose = () => {
    setSuccessData(null);
    setStoreCode("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop: No se cierra al hacer clic afuera */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative w-full max-w-md bg-[#181215]/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 z-10 border border-white/20 text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/25">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#5A0C18] border border-[#D4AF37]/60 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5 text-[#EEDC94]" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-white tracking-wide">
                Registrar Uso en Local
              </h3>
              <p className="text-[11px] text-[#F7EDC4]/80">
                Rosa Pasión Club
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            type="button"
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4">
          {successData ? (
            /* Vista de Éxito / Comprobante de Canje */
            <div className="text-center py-2 space-y-4 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-full bg-emerald-950/90 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-500/40 mb-1.5">
                  ¡Descuento Confirmado!
                </span>
                <h4 className="text-lg font-serif font-bold gold-gradient-text">
                  {successData.business?.name}
                </h4>
                <p className="text-xs font-semibold text-white/90 mt-0.5">
                  {successData.business?.discountSummary}
                </p>
              </div>

              {/* Ticket digital */}
              <div className="bg-black/50 rounded-2xl p-3.5 border border-[#D4AF37]/30 text-left text-xs space-y-2 shadow-inner">
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-stone-400">Socio:</span>
                  <strong className="text-white font-semibold">{successData.member?.name}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Código Membresía:</span>
                  <span className="font-mono text-[#EEDC94] font-bold">{successData.member?.code}</span>
                </div>
                {successData.member?.documentNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">DNI:</span>
                    <span className="text-stone-300 font-mono">{successData.member?.documentNumber}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-white/10 text-[11px]">
                  <span className="text-stone-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#D4AF37]" />
                    Fecha y Hora:
                  </span>
                  <span className="text-stone-300">
                    {new Date(successData.log?.date).toLocaleString("es-PE")}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-2.5 px-6 rounded-full gold-gradient-bg text-[#230408] font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer"
              >
                Aceptar y Finalizar
              </button>
            </div>
          ) : (
            /* Formulario Simple: Solo pide el código del negocio y botones Confirmar / Cancelar */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tarjeta resumen del socio */}
              <div className="bg-[#4F0712]/60 rounded-2xl p-3 border border-[#D4AF37]/30 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-[#EEDC94] font-semibold block">
                    Socio Verificado
                  </span>
                  <h4 className="text-xs font-bold text-white truncate max-w-[220px]">
                    {member.name}
                  </h4>
                  <span className="text-[10px] font-mono text-stone-300">
                    {member.code} {member.documentNumber ? `• DNI: ${member.documentNumber}` : ""}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                  ACTIVA
                </span>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Campo único: Código del Negocio */}
              <div className="space-y-2 bg-white/[0.06] p-4 rounded-2xl border border-white/15">
                <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-[#D4AF37]" />
                  Código del Negocio:
                </label>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Pide al cajero o personal del establecimiento que digite su <strong>código de local</strong> para registrar el descuento.
                </p>
                <input
                  type="text"
                  required
                  autoFocus
                  value={storeCode}
                  onChange={(e) => {
                    setStoreCode(e.target.value.toUpperCase());
                    if (error) setError(null);
                  }}
                  placeholder=""
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center text-base font-mono font-black tracking-widest text-[#EEDC94] placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Botones: Cancelar y Confirmar */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  disabled={isPending}
                  className="w-full py-3 px-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !storeCode.trim()}
                  className="w-full py-3 px-4 rounded-xl gold-gradient-bg text-[#230408] font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Validando..." : "Confirmar"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
