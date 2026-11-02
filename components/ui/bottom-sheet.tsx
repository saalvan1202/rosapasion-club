"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, subtitle, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      {/* Backdrop: No se cierra al hacer clic afuera */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />

      {/* Sheet Container */}
      <div className="relative w-full sm:max-w-md bg-gradient-to-b from-[#2F070E] to-[#140306] border-t sm:border border-[#D4AF37]/30 rounded-t-3xl sm:rounded-2xl p-6 text-white shadow-2xl z-10 animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
        {/* Grab bar for mobile */}
        <div className="w-12 h-1.5 bg-[#D4AF37]/40 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-start justify-between pb-3 border-b border-[#D4AF37]/20">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#F3E5AB]">{title}</h3>
            {subtitle && <p className="text-xs text-stone-300 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 overflow-y-auto flex-1 pr-1">
          {children}
        </div>
      </div>
    </div>
  );
}
