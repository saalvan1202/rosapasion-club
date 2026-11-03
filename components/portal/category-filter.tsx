"use client";

import React from "react";
import { Store } from "lucide-react";
import { renderCategoryIcon } from "@/lib/category-icons";

interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
}

export function CategoryFilter({ categories, selectedSlug, onSelect }: CategoryFilterProps) {
  const getIcon = (iconName: string) => {
    return renderCategoryIcon(iconName, "w-5 h-5 text-current");
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <h3 className="text-xs font-bold text-stone-200 tracking-wide uppercase">
          Explorar Beneficios por Negocio
        </h3>
        {selectedSlug && (
          <button
            onClick={() => onSelect(null)}
            className="text-[10px] text-[#D4AF37] hover:underline"
          >
            Ver todos
          </button>
        )}
      </div>

      <div className="overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-start gap-4 min-w-max px-1">
          {/* Opción Todos */}
          <button
            onClick={() => onSelect(null)}
            className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                selectedSlug === null
                  ? "bg-[#D4AF37] text-[#2F070E] border-[#F3E5AB] shadow-md shadow-[#D4AF37]/30 scale-105"
                  : "bg-[#2A050B] text-stone-300 border-[#D4AF37]/20 group-hover:border-[#D4AF37]/50"
              }`}
            >
              <Store className="w-6 h-6 text-current" />
            </div>
            <span
              className={`text-[9px] font-bold uppercase tracking-wider text-center max-w-[64px] leading-tight ${
                selectedSlug === null ? "text-[#F3E5AB]" : "text-stone-300"
              }`}
            >
              TODOS
            </span>
          </button>

          {/* Categorías */}
          {categories.map((cat) => {
            const isSelected = selectedSlug === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.slug)}
                className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                    isSelected
                      ? "bg-[#D4AF37] text-[#2F070E] border-[#F3E5AB] shadow-md shadow-[#D4AF37]/30 scale-105"
                      : "bg-[#2A050B] text-stone-300 border-[#D4AF37]/20 group-hover:border-[#D4AF37]/50"
                  }`}
                >
                  {getIcon(cat.iconName)}
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider text-center max-w-[70px] leading-tight ${
                    isSelected ? "text-[#F3E5AB]" : "text-stone-300"
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
