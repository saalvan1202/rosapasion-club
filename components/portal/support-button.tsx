"use client";

import React from "react";
import { MessageCircle } from "lucide-react";

interface SupportButtonProps {
  supportPhone: string;
}

export function SupportButton({ supportPhone }: SupportButtonProps) {
  const cleanNumber = supportPhone.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
    "Hola, necesito soporte y asistencia con mi membresía Rosa Pasión Club."
  )}`;

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Soporte por WhatsApp"
        className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white font-bold text-xs shadow-xl shadow-black/60 border border-emerald-400/40 hover:scale-105 active:scale-95 transition-all"
      >
        <MessageCircle className="w-5 h-5 fill-current" />
        <span className="hidden sm:inline">Soporte Rosa Pasión</span>
        <span className="sm:hidden">Soporte</span>
      </a>
    </div>
  );
}
