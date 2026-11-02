"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Store, CheckCircle2, Search, ExternalLink, Power, Phone } from "lucide-react";
import { toggleBusinessStatus } from "@/actions/business";
import { Pagination } from "@/components/ui/pagination";

interface Term {
  id: string;
  description: string;
  isRule: boolean;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  discountSummary: string;
  whatsappNumber: string;
  isActive: boolean;
  category: { id: string; name: string };
  terms: Term[];
}

interface BenefitManagerProps {
  initialBusinesses: Business[];
}

export function BenefitManager({ initialBusinesses }: BenefitManagerProps) {
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  const [search, setSearch] = useState("");

  // Pagination (6 beneficios por página)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const handleToggle = async (id: string, current: boolean) => {
    const next = !current;
    setBusinesses((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: next } : b))
    );
    await toggleBusinessStatus(id, next);
  };

  const filtered = businesses.filter((b) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      b.name.toLowerCase().includes(q) ||
      b.discountSummary.toLowerCase().includes(q) ||
      b.category.name.toLowerCase().includes(q)
    );
  });

  const totalItems = filtered.length;
  const paginatedBusinesses = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Catálogo de Beneficios Activos
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Supervisa los convenios de descuento y promociones vigentes ofrecidos a los socios
          </p>
        </div>

        <Link
          href="/admin/businesses"
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#4A0A10] hover:bg-[#580A15] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
        >
          <Store className="w-4 h-4" />
          <span>Gestionar Comercios</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder=""
          className="w-full text-xs text-stone-800 placeholder-stone-400 focus:outline-none"
        />
        {search && (
          <button
            onClick={() => {
              setSearch("");
              setCurrentPage(1);
            }}
            className="text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedBusinesses.map((b) => {
            const cleanPhone = b.whatsappNumber.replace(/[^0-9]/g, "");
            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
              `Hola ${b.name}, consulto por el beneficio de Rosa Pasión Club: ${b.discountSummary}`
            )}`;

            return (
              <div
                key={b.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  b.isActive
                    ? "bg-white border-stone-200 shadow-xs hover:shadow-md"
                    : "bg-stone-50 border-stone-200 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#4A0A10] bg-[#FAF2E8] border border-[#D4AF37]/30 px-2 py-0.5 rounded">
                      {b.category.name}
                    </span>

                    <button
                      onClick={() => handleToggle(b.id, b.isActive)}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                        b.isActive
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-stone-200 text-stone-600 border border-stone-300"
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{b.isActive ? "Activo" : "Inactivo"}</span>
                    </button>
                  </div>

                  <h3 className="font-serif font-bold text-base text-stone-900 mb-2">{b.name}</h3>

                  <div className="p-3 rounded-xl bg-[#FAF2E8]/60 border border-[#D4AF37]/20 mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#4A0A10] block">
                      Beneficio Rosa Pasión:
                    </span>
                    <p className="text-xs font-bold text-stone-900 mt-0.5">{b.discountSummary}</p>
                  </div>

                  <div className="space-y-1.5 mb-4 text-[11px] text-stone-600">
                    <p className="font-semibold text-stone-700 text-xs">Condiciones principales:</p>
                    {b.terms.slice(0, 2).map((t) => (
                      <div key={t.id} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{t.description}</span>
                      </div>
                    ))}
                    {b.terms.length > 2 && (
                      <p className="text-[10px] text-stone-400 italic">
                        +{b.terms.length - 2} condiciones adicionales registradas
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Probar WhatsApp</span>
                  </a>

                  <Link
                    href="/admin/businesses"
                    className="text-xs font-semibold text-[#4A0A10] hover:underline"
                  >
                    Editar →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Paginación */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
