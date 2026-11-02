"use client";

import React, { useState } from "react";
import { Phone, ChevronDown, ChevronUp, Check, AlertCircle } from "lucide-react";

export interface BusinessTerm {
  id: string;
  description: string;
  isRule: boolean;
  order: number;
}

export interface BusinessItem {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  discountSummary: string;
  whatsappNumber: string;
  validUntil?: Date | string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  terms: BusinessTerm[];
}

interface BusinessCardProps {
  business: BusinessItem;
}

export function BusinessCard({ business }: BusinessCardProps) {
  const [isConditionsOpen, setIsConditionsOpen] = useState(false);

  const cleanNumber = business.whatsappNumber.replace(/[^0-9]/g, "");
  const waText = encodeURIComponent(
    `¡Hola! Soy socio de Rosa Pasión Club y deseo hacer uso de mi beneficio exclusivo en ${business.name}.`
  );
  const waUrl = `https://wa.me/${cleanNumber}?text=${waText}`;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-stone-200 text-stone-900 transition-all">
      {/* Top Header: Logo, Name & Discount */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-serif font-black text-sm text-[#4A0A10]">
                {business.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-stone-900 leading-tight">
              {business.name}
            </h4>
            <p className="text-xs font-semibold text-stone-700 mt-0.5">
              {business.discountSummary}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsConditionsOpen(!isConditionsOpen)}
          className="p-1 text-stone-400 hover:text-stone-700 transition-colors"
          title="Ver condiciones"
        >
          {isConditionsOpen ? (
            <ChevronUp className="w-4 h-4 text-stone-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-600" />
          )}
        </button>
      </div>

      {/* Accordion: Condiciones v */}
      <div className="mt-3 pt-2 border-t border-stone-100">
        <button
          onClick={() => setIsConditionsOpen(!isConditionsOpen)}
          className="flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
        >
          <span>Condiciones</span>
          {isConditionsOpen ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>

        {isConditionsOpen && (
          <div className="mt-2 p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 animate-in fade-in duration-150">
            {business.terms && business.terms.length > 0 ? (
              business.terms.map((term) => (
                <div key={term.id} className="flex items-start gap-1.5 text-[11px] text-stone-700">
                  <Check className="w-3 h-3 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{term.description}</span>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-stone-500 italic">
                Presentar membresía activa al momento de solicitar el servicio.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Button: "Contactar" (Gold Pill Button from Mockup) */}
      <div className="mt-3">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-gradient-to-r from-[#C59B27] via-[#E5C058] to-[#C59B27] hover:brightness-105 active:scale-98 text-[#2F070E] font-bold text-xs uppercase tracking-wider shadow-md transition-all"
        >
          <Phone className="w-3.5 h-3.5 text-[#2F070E]" />
          <span>Contactar</span>
        </a>
      </div>
    </div>
  );
}
