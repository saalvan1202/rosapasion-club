"use client";

import React, { useState, useTransition } from "react";
import {
  Plus,
  Trash2,
  Search,
  Calendar,
  Store,
  Clock,
  X,
  Tag,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { createHistoryLog, deleteHistoryLog, HistoryData } from "@/actions/history";
import { Pagination } from "@/components/ui/pagination";

interface HistoryLog {
  id: string;
  memberCode: string;
  memberName: string;
  businessName: string;
  discountApplied: string;
  notes?: string | null;
  createdAt: Date | string;
}

interface Business {
  id: string;
  name: string;
  discountSummary: string;
}

interface Member {
  id: string;
  code: string;
  name: string;
}

interface HistoryManagerProps {
  initialLogs: HistoryLog[];
  businesses: Business[];
  members: Member[];
}

export function HistoryManager({ initialLogs, businesses, members }: HistoryManagerProps) {
  const [logs, setLogs] = useState<HistoryLog[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination (5 por página)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [formData, setFormData] = useState<HistoryData>({
    memberCode: members[0]?.code || "RPC-0001",
    memberName: members[0]?.name || "Orison David",
    businessName: businesses[0]?.name || "Master Ulala",
    discountApplied: businesses[0]?.discountSummary || "15% de Descuento",
    notes: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      log.memberCode.toLowerCase().includes(q) ||
      log.memberName.toLowerCase().includes(q) ||
      log.businessName.toLowerCase().includes(q) ||
      log.discountApplied.toLowerCase().includes(q) ||
      (log.notes && log.notes.toLowerCase().includes(q))
    );
  });

  const totalItems = filteredLogs.length;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleOpenCreate = () => {
    const firstMember = members[0];
    const firstBiz = businesses[0];
    setFormData({
      memberCode: firstMember?.code || "RPC-0001",
      memberName: firstMember?.name || "Orison David",
      businessName: firstBiz?.name || "Master Ulala",
      discountApplied: firstBiz?.discountSummary || "15% de Descuento",
      notes: "Canje verificado y validado en establecimiento.",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleMemberChange = (code: string) => {
    const m = members.find((mem) => mem.code === code);
    setFormData((prev) => ({
      ...prev,
      memberCode: code,
      memberName: m ? m.name : prev.memberName,
    }));
  };

  const handleBusinessChange = (name: string) => {
    const b = businesses.find((biz) => biz.name === name);
    setFormData((prev) => ({
      ...prev,
      businessName: name,
      discountApplied: b ? b.discountSummary : prev.discountApplied,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await createHistoryLog(formData);
      if (res.success && res.log) {
        setLogs((prev) => [res.log as unknown as HistoryLog, ...prev]);
        setIsModalOpen(false);
      } else {
        setError(res.message || "Error al registrar el canje");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este registro del historial?")) return;

    startTransition(async () => {
      const res = await deleteHistoryLog(id);
      if (res.success) {
        setLogs((prev) => prev.filter((l) => l.id !== id));
      } else {
        alert(res.message || "Error al eliminar");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Historial de Canjes & Beneficios
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Registro de validaciones de membresía y descuentos utilizados en comercios aliados
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#4A0A10] hover:bg-[#580A15] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Canje</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Buscar por socio, código de tarjeta, comercio aliado o descuento..."
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

      {/* Logs Table / Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        
        {/* VISTA MÓVIL (Cards Verticales para Pantallas < 768px) */}
        <div className="block md:hidden divide-y divide-stone-100">
          {paginatedLogs.length > 0 ? (
            paginatedLogs.map((log) => {
              const dateObj = new Date(log.createdAt);
              const formattedDate = dateObj.toLocaleDateString("es-PE", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const formattedTime = dateObj.toLocaleTimeString("es-PE", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={log.id} className="p-4 space-y-3 hover:bg-stone-50/50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs bg-[#FAF2E8] border border-[#D4AF37]/40 px-2.5 py-1 rounded-lg text-[#4A0A10]">
                      {log.memberCode}
                    </span>
                    <div className="text-[11px] text-stone-500 flex items-center gap-1 font-medium" suppressHydrationWarning>
                      <Calendar className="w-3 h-3 text-stone-400" />
                      <span>{formattedDate} {formattedTime}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-stone-500 font-medium">Socio Titular</p>
                    <h4 className="font-bold text-stone-900 text-sm leading-tight">{log.memberName}</h4>
                  </div>

                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                      <Store className="w-3.5 h-3.5 text-[#4A0A10]" />
                      <span>{log.businessName}</span>
                    </div>
                    <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#FAF2E8] text-[#4A0A10] border border-[#D4AF37]/30">
                      {log.discountApplied}
                    </span>
                    {log.notes && (
                      <p className="text-[11px] text-stone-500 italic mt-1">{log.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-600 transition-colors cursor-pointer py-1 px-2 rounded hover:bg-red-50"
                      title="Eliminar del historial"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Registro</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-stone-400 text-xs">
              No hay registros de canjes en el historial aún.
            </div>
          )}
        </div>

        {/* VISTA DESKTOP (Tabla Completa para Pantallas >= 768px) */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[680px] sm:min-w-full">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-700 font-semibold">
              <th className="py-3 px-4 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                Fecha y Hora
              </th>
              <th className="py-3 px-4 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                Socio
              </th>
              <th className="py-3 px-6 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                Comercio Aliado
              </th>
              <th className="py-3 px-6 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                Beneficio Aplicado
              </th>
              <th className="py-3 px-6 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                Observaciones
              </th>
              <th className="py-3 px-4 text-right text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-800">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => {
                const dateObj = new Date(log.createdAt);
                const formattedDate = dateObj.toLocaleDateString("es-PE", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                const formattedTime = dateObj.toLocaleTimeString("es-PE", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr key={log.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-stone-500 text-[11px] whitespace-nowrap" suppressHydrationWarning>
                      <div className="flex items-center gap-1.5 font-medium text-stone-800" suppressHydrationWarning>
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span suppressHydrationWarning>{formattedDate}</span>
                      </div>
                      <div className="text-[10px] text-stone-400 pl-5" suppressHydrationWarning>{formattedTime}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-[11px] bg-[#FAF2E8] border border-[#D4AF37]/40 px-2 py-0.5 rounded text-[#4A0A10]">
                        {log.memberCode}
                      </span>
                      <p className="font-semibold text-stone-900 text-xs mt-1">{log.memberName}</p>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        <Store className="w-3.5 h-3.5 text-[#4A0A10]" />
                        <span className="font-bold text-stone-900">{log.businessName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#FAF2E8] text-[#4A0A10] border border-[#D4AF37]/30">
                        {log.discountApplied}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-[11px] text-stone-600 max-w-xs">
                      {log.notes || "Canje regular verificado."}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Eliminar del historial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-stone-400">
                  No hay registros de canjes en el historial aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        {/* Paginación */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal Registrar Canje: Tamaño compacto y scroll ergonómico */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop: No se cierra al hacer clic afuera */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-7 z-10 border border-stone-200 animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4 flex-shrink-0">
              <h3 className="text-base font-bold text-stone-900">
                Registrar Canje de Beneficio
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex-shrink-0">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Código de Socio
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.memberCode}
                    onChange={(e) => handleMemberChange(e.target.value)}
                    placeholder="RPC-0001"
                    className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#4A0A10]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nombre del Socio
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.memberName}
                    onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                    placeholder="Orison David"
                    className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#4A0A10]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Comercio Aliado
                </label>
                <select
                  value={formData.businessName}
                  onChange={(e) => handleBusinessChange(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Detalle del Beneficio Aplicado
                </label>
                <input
                  type="text"
                  required
                  value={formData.discountApplied}
                  onChange={(e) => setFormData({ ...formData, discountApplied: e.target.value })}
                  placeholder="Ej: 15% de Descuento en Lavado de Vehículos"
                  className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Notas u Observaciones
                </label>
                <textarea
                  rows={2}
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalles adicionales del consumo o canje..."
                  className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#C59B27] via-[#E5C058] to-[#C59B27] text-[#2F070E] font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer hover:brightness-105"
                >
                  {isPending ? "Registrando..." : "Guardar Canje"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
