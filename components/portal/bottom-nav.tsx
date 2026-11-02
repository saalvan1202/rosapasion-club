"use client";

import React from "react";
import { MessageCircle, QrCode } from "lucide-react";

interface BottomNavProps {
  supportPhone: string;
  catalogUrl: string;
}

export function BottomNav({ supportPhone, catalogUrl }: BottomNavProps) {
  const cleanNumber = supportPhone.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
    "Hola, deseo asistencia y soporte respecto a mi membresía Rosa Pasión Club."
  )}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#2D0408]/95 backdrop-blur-md border-t border-[#D4AF37]/30 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] px-6 shadow-2xl">
      <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
        {/* Soporte WhatsApp */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 text-stone-200 hover:text-white transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-emerald-400 fill-current" />
          </div>
          <span className="text-[10px] font-bold tracking-wide">Soporte WhatsApp</span>
        </a>

        {/* Catálogo Oficial */}
        <a
          href={catalogUrl || "https://catalogo.rosapasion.com"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 text-stone-200 hover:text-white transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 text-[#F3E5AB] flex items-center justify-center">
            <QrCode className="w-4 h-4 text-[#F3E5AB]" />
          </div>
          <span className="text-[10px] font-bold tracking-wide">Catálogo Oficial</span>
        </a>
      </div>
    </div>
  );
}
