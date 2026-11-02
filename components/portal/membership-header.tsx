"use client";

import React from "react";
import { ExternalLink, Sparkles } from "lucide-react";

interface MembershipHeaderProps {
  catalogUrl: string;
  onDiscoverClick?: () => void;
}

export function MembershipHeader({ catalogUrl, onDiscoverClick }: MembershipHeaderProps) {
  return (
    <header className="w-full pb-4 text-center">
      {/* Exclusive VIP Card (Identical to Mobile Mockup) */}
      <div className="relative rounded-2xl p-5 overflow-hidden border border-[#D4AF37]/50 shadow-2xl bg-gradient-to-b from-[#580A15] via-[#3B070D] to-[#240307]">
        {/* Subtle patterned gold vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.15),_transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo Oficial Vertical */}
          <div className="w-24 p-2 rounded-xl bg-white mx-auto mb-2 shadow-lg border border-[#D4AF37]/50 flex items-center justify-center">
            <img
              src="/logo-vertical.png"
              alt="Rosa Pasión"
              className="w-full h-auto object-contain"
            />
          </div>
          <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] block font-bold">
            CLUB DE PRIVILEGIOS
          </span>

          {/* Member Name and RPC Code */}
          <div className="mt-3 text-center">
            <h2 className="text-sm font-bold text-white tracking-wide">
              Orison David - RPC-0001
            </h2>
            <p className="text-[11px] text-stone-300 mt-0.5 max-w-xs">
              Bienvenido(a) a tu catálogo exclusivo de beneficios de Rosa Pasión.
            </p>
          </div>
        </div>
      </div>

      {/* Two Action Buttons (Mockup: "Ver Catálogo" y "Descubrir Beneficios") */}
      <div className="mt-3.5 space-y-2">
        <a
          href={catalogUrl || "https://catalogo.rosapasion.com"}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-[#4A0A10] hover:bg-[#580A15] text-white font-bold text-xs tracking-wider border border-[#D4AF37]/40 shadow-md active:scale-98 transition-all"
        >
          <span>Ver Catálogo</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#F3E5AB]" />
        </a>

        <button
          onClick={onDiscoverClick}
          className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-gradient-to-r from-[#C59B27] via-[#E5C058] to-[#C59B27] hover:brightness-105 text-[#2F070E] font-bold text-xs uppercase tracking-wider shadow-md active:scale-98 transition-all cursor-pointer"
        >
          <span>Descubrir Beneficios</span>
          <Sparkles className="w-3.5 h-3.5 text-[#2F070E]" />
        </button>
      </div>
    </header>
  );
}
