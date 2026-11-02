"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  className = "",
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems <= pageSize) {
    return (
      <div className={`flex items-center justify-between text-xs text-stone-500 py-3 px-4 border-t border-stone-100 ${className}`}>
        <span>Mostrando todos los {totalItems} registros</span>
        <span className="font-medium text-stone-400">Página 1 de 1</span>
      </div>
    );
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    }
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600 py-3.5 px-4 sm:px-6 border-t border-stone-200 bg-stone-50/50 ${className}`}
    >
      <div className="text-stone-500">
        Mostrando <strong className="text-stone-800">{startItem}</strong> a{" "}
        <strong className="text-stone-800">{endItem}</strong> de{" "}
        <strong className="text-stone-800">{totalItems}</strong> registros
      </div>

      <div className="flex items-center gap-1.5">
        {/* Botón Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer text-xs font-medium shadow-2xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Anterior</span>
        </button>

        {/* Páginas numéricas */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            const prev = pages[idx - 1];
            const showEllipsis = prev && p - prev > 1;

            return (
              <React.Fragment key={p}>
                {showEllipsis && <span className="px-1 text-stone-400">...</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    p === currentPage
                      ? "bg-[#4A0A10] text-white shadow-xs"
                      : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  {p}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Botón Siguiente */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer text-xs font-medium shadow-2xs"
        >
          <span>Siguiente</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
