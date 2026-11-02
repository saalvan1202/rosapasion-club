"use client";

import React, { useState, useTransition } from "react";
import { Crown, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await loginAction(null, formData);
      if (res.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(res.message || "Error al iniciar sesión");
      }
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#140306] via-[#2F070E] to-[#140306] flex items-center justify-center p-4">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#7A1222]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Header brand */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-28 sm:w-32 p-3 rounded-2xl bg-white shadow-2xl border-2 border-[#D4AF37]/60 mb-3 flex items-center justify-center">
            <img
              src="/logo-vertical.png"
              alt="Rosa Pasión"
              className="w-full h-auto object-contain"
            />
          </div>
          <span className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-bold block">
            Panel de Control Administrativo
          </span>
          <p className="text-xs text-stone-300 mt-1">
            Gestión y Administración de Alianzas Comerciales
          </p>
        </div>

        {/* Login Box */}
        <div className="rounded-3xl border border-[#D4AF37]/35 bg-[#2F070E]/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/80">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#D4AF37]/20 text-[#F3E5AB]">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-sm font-semibold tracking-wide">Acceso Administrativo Seguro</h2>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                Usuario o Correo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="email"
                  required
                  placeholder=""
                  className="w-full bg-[#140306]/80 border border-[#D4AF37]/30 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder=""
                  className="w-full bg-[#140306]/80 border border-[#D4AF37]/30 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#2F070E] font-bold text-sm tracking-wide shadow-lg shadow-[#D4AF37]/25 hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isPending ? (
                <span>Validando credenciales...</span>
              ) : (
                <>
                  <span>Ingresar al CMS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-800/80 text-center">
            <Link
              href="/"
              className="text-xs text-stone-400 hover:text-[#D4AF37] transition-colors inline-flex items-center gap-1"
            >
              ← Volver al Portal de Socios
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
