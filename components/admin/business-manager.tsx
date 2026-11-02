"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  X,
  Upload,
  Calendar,
  Image as ImageIcon,
  Check,
  Plus,
  Trash2,
  Phone,
  Power,
  ChevronDown,
  Search,
  Key,
  Sparkles,
  GripVertical,
  CheckCircle2,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import {
  createBusiness,
  updateBusiness,
  deleteBusiness,
  toggleBusinessStatus,
  reorderBusinesses,
} from "@/actions/business";
import { Pagination } from "@/components/ui/pagination";
import { LogoCropperModal } from "./logo-cropper-modal";

interface Term {
  id?: string;
  description: string;
  isRule: boolean;
  order: number;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  category: { id: string; name: string };
  logoUrl?: string | null;
  discountSummary: string;
  whatsappNumber: string;
  storeCode?: string;
  validUntil?: Date | string | null;
  isActive: boolean;
  order: number;
  terms: Term[];
}

interface Category {
  id: string;
  name: string;
}

interface BusinessManagerProps {
  initialBusinesses: Business[];
  categories: Category[];
}

export function BusinessManager({ initialBusinesses, categories }: BusinessManagerProps) {
  // Inicializar siempre ordenado por 'order' ascendente
  const [businesses, setBusinesses] = useState<Business[]>(() =>
    [...initialBusinesses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  // Sincronizar si cambian los props iniciales del servidor
  useEffect(() => {
    setBusinesses([...initialBusinesses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  }, [initialBusinesses]);

  // Drag and Drop reordering state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState<string | null>(null);

  // Search & Pagination state
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(5);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    categoryId: categories[0]?.id || "",
    logoUrl: "",
    discountSummary: "",
    whatsappNumber: "+51999999999",
    storeCode: "1234",
    validUntil: "",
    isActive: true,
    order: 0,
    terms: [] as Term[],
  });

  const [newTermDescription, setNewTermDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Drag and Drop Event Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    // Sin acción obligatoria
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedId || e.dataTransfer.getData("text/plain");
    setDraggedId(null);
    setDragOverId(null);

    if (!sourceId || sourceId === targetId) return;

    const sourceIndex = businesses.findIndex((b) => b.id === sourceId);
    const targetIndex = businesses.findIndex((b) => b.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    // Reordenar array completo respetando el movimiento
    const updated = [...businesses];
    const [movedItem] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    // Reasignar orden secuencial 1, 2, 3...
    const updatedWithOrder = updated.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    // Actualización optimista instantánea
    setBusinesses(updatedWithOrder);
    setIsReordering(true);

    startTransition(async () => {
      try {
        const payload = updatedWithOrder.map((b) => ({ id: b.id, order: b.order }));
        const res = await reorderBusinesses(payload);
        if (res.success) {
          setReorderSuccessMsg("¡Nuevo orden guardado! Los cambios ya se reflejan en la web.");
          setTimeout(() => setReorderSuccessMsg(null), 3500);
        } else {
          alert("No se pudo guardar el orden: " + (res.message || "Error"));
          setBusinesses(businesses); // Revertir
        }
      } catch (err) {
        setBusinesses(businesses);
      } finally {
        setIsReordering(false);
      }
    });
  };

  // Filtered & Paged items
  const filteredBusinesses = businesses.filter((b) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      b.name.toLowerCase().includes(q) ||
      b.discountSummary.toLowerCase().includes(q) ||
      b.category.name.toLowerCase().includes(q) ||
      b.whatsappNumber.includes(q)
    );
  });

  const totalItems = filteredBusinesses.length;
  const paginatedBusinesses = filteredBusinesses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleOpenCreate = () => {
    setEditingBusiness(null);
    setFormData({
      name: "",
      slug: "",
      categoryId: categories[0]?.id || "",
      logoUrl: "",
      discountSummary: "15% de Descuento",
      whatsappNumber: "+51999999999",
      storeCode: "1234",
      validUntil: "2026-11-21",
      isActive: true,
      order: businesses.length + 1,
      terms: [
        { description: "Presentar tarjeta física o digital de socio", isRule: true, order: 1 },
        { description: "No acumulable con otras promociones", isRule: false, order: 2 },
      ],
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (biz: Business) => {
    setEditingBusiness(biz);
    setFormData({
      name: biz.name,
      slug: biz.slug,
      categoryId: biz.categoryId,
      logoUrl: biz.logoUrl || "",
      discountSummary: biz.discountSummary,
      whatsappNumber: biz.whatsappNumber,
      storeCode: biz.storeCode || "1234",
      validUntil: biz.validUntil ? new Date(biz.validUntil).toISOString().split("T")[0] : "",
      isActive: biz.isActive,
      order: biz.order,
      terms: biz.terms || [],
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingBusiness ? prev.slug : slug,
    }));
  };

  const handleAddTerm = () => {
    if (!newTermDescription.trim()) return;
    setFormData((prev) => ({
      ...prev,
      terms: [
        ...prev.terms,
        {
          description: newTermDescription.trim(),
          isRule: true,
          order: prev.terms.length + 1,
        },
      ],
    }));
    setNewTermDescription("");
  };

  const handleRemoveTerm = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      terms: prev.terms.filter((_, idx) => idx !== index),
    }));
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setBusinesses((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: newStatus } : b))
    );

    startTransition(async () => {
      const res = await toggleBusinessStatus(id, newStatus);
      if (!res.success) {
        setBusinesses((prev) =>
          prev.map((b) => (b.id === id ? { ...b, isActive: currentStatus } : b))
        );
        alert(res.message || "Error al cambiar estado");
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      if (editingBusiness) {
        const res = await updateBusiness(editingBusiness.id, formData);
        if (res.success && res.business) {
          const cat = categories.find((c) => c.id === formData.categoryId);
          const updated = {
            ...res.business,
            category: cat || { id: formData.categoryId, name: "General" },
          } as unknown as Business;
          setBusinesses((prev) =>
            prev.map((b) => (b.id === editingBusiness.id ? updated : b))
          );
          setIsModalOpen(false);
        } else {
          setError(res.message || "Error al actualizar comercio");
        }
      } else {
        const res = await createBusiness(formData);
        if (res.success && res.business) {
          const cat = categories.find((c) => c.id === formData.categoryId);
          const created = {
            ...res.business,
            category: cat || { id: formData.categoryId, name: "General" },
          } as unknown as Business;
          setBusinesses((prev) => [created, ...prev]);
          setIsModalOpen(false);
        } else {
          setError(res.message || "Error al crear comercio");
        }
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Dar de baja al comercio aliado "${name}"? Sus canjes pasados se conservarán de forma segura en el historial.`)) return;

    startTransition(async () => {
      const res = await deleteBusiness(id);
      if (res.success) {
        setBusinesses((prev) => prev.filter((b) => b.id !== id));
      } else {
        alert(res.message || "Error al eliminar comercio");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Title & "Crear Aliado" Pill Button */}
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
          Comercios Aliados
        </h2>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#4A0A10] hover:bg-[#580A15] text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <span>Crear Aliado</span>
        </button>
      </div>

      {/* Search Bar & Page Size Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-3 flex items-center gap-3 flex-1">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar comercio aliado por nombre, categoría, WhatsApp o beneficio..."
            className="w-full text-xs text-stone-800 placeholder-stone-400 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setCurrentPage(1);
              }}
              className="text-stone-400 hover:text-stone-600 text-xs font-medium cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Selector de cantidad por página para facilitar el Drag & Drop */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 px-3 py-2 flex items-center gap-2 text-xs text-stone-500 whitespace-nowrap self-end sm:self-auto">
          <span className="font-medium text-stone-600">Mostrar:</span>
          {[5, 10, 20, 50].map((size) => (
            <button
              key={size}
              onClick={() => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                pageSize === size
                  ? "bg-[#4A0A10] text-white shadow-xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {size}
            </button>
          ))}
          <button
            onClick={() => {
              setPageSize(1000);
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              pageSize >= 1000
                ? "bg-[#4A0A10] text-white shadow-xs"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
            title="Ver todos para reordenar la lista completa fácilmente"
          >
            Todos
          </button>
        </div>
      </div>

      {/* Helper Banner & Live Feedback */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#FAF2E8]/80 to-stone-50 border border-[#D4AF37]/30 text-xs text-stone-700">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
          <span>
            <strong className="text-stone-900 font-semibold">Drag & Drop activado:</strong>{" "}
            Arrastra cualquier fila usando el ícono de agarre para definir el orden en la web (se aplica sin importar la categoría).
          </span>
        </div>

        {isReordering && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold animate-pulse self-start sm:self-auto">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Sincronizando orden...</span>
          </div>
        )}

        {reorderSuccessMsg && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold animate-in fade-in self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{reorderSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Main Table Card with Pagination */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        
        {/* VISTA MÓVIL (Cards Verticales para Pantallas < 768px) */}
        <div className="block md:hidden divide-y divide-stone-100">
          {paginatedBusinesses.length > 0 ? (
            paginatedBusinesses.map((biz, idx) => {
              const globalIndex = businesses.findIndex((b) => b.id === biz.id);
              const orderNumber = biz.order || (globalIndex !== -1 ? globalIndex + 1 : idx + 1);

              return (
                <div key={biz.id} className="p-4 space-y-3 hover:bg-stone-50/50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-stone-100 border border-stone-200 px-2 py-0.5 rounded text-stone-700">
                      Posición #{orderNumber}
                    </span>
                    {biz.isActive ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Activo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-stone-100 text-stone-500 border border-stone-200">
                        Inactivo
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xs">
                      {biz.logoUrl ? (
                        <img
                          src={biz.logoUrl}
                          alt={biz.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#F5ECE1] text-[#4A0A10] font-serif font-bold text-sm flex items-center justify-center">
                          {biz.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-stone-900 truncate">{biz.name}</h4>
                      <p className="text-[11px] text-stone-500 font-medium">
                        {biz.category?.name || "General"}
                      </p>
                      <p className="text-xs font-semibold text-[#4A0A10] mt-0.5 truncate">
                        {biz.discountSummary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                    <button
                      onClick={() => handleOpenEdit(biz)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-[#D4AF37] hover:bg-[#C59B27] text-white font-medium text-xs shadow-xs transition-colors cursor-pointer text-center"
                    >
                      Editar
                    </button>
                    {biz.isActive ? (
                      <button
                        onClick={() => handleToggleStatus(biz.id, biz.isActive)}
                        className="py-1.5 px-3 rounded-lg bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4] font-medium text-xs transition-colors cursor-pointer"
                      >
                        Pausar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(biz.id, biz.isActive)}
                        className="py-1.5 px-3 rounded-lg bg-[#DEF7EC] text-[#03543F] border border-[#BCF0DA] font-medium text-xs transition-colors cursor-pointer"
                      >
                        Activar
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(biz.id, biz.name)}
                      className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-stone-400 text-xs">
              No hay comercios aliados registrados aún.
            </div>
          )}
        </div>

        {/* VISTA DESKTOP (Tabla Completa para Pantallas >= 768px) */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[550px] sm:min-w-full">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-700 font-semibold select-none">
              <th className="py-3 pl-4 pr-1 w-14 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center justify-center gap-1" title="Orden de visualización en la web pública">
                  <ArrowUpDown className="w-3 h-3 text-[#D4AF37]" />
                  Orden
                </span>
              </th>
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  className="rounded border-stone-300 text-[#4A0A10] focus:ring-[#4A0A10]"
                  readOnly
                />
              </th>
              <th className="py-3 px-6 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                Marcas Aliadas
              </th>
              <th className="py-3 px-6 text-right text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-800">
            {paginatedBusinesses.length > 0 ? (
              paginatedBusinesses.map((biz, idx) => {
                const globalIndex = businesses.findIndex((b) => b.id === biz.id);
                const orderNumber = biz.order || (globalIndex !== -1 ? globalIndex + 1 : idx + 1);
                const isDragging = draggedId === biz.id;
                const isOver = dragOverId === biz.id && !isDragging;

                return (
                  <tr
                    key={biz.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, biz.id)}
                    onDragOver={(e) => handleDragOver(e, biz.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, biz.id)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all duration-150 group cursor-grab active:cursor-grabbing select-none ${
                      isDragging
                        ? "opacity-35 bg-amber-50/60 scale-[0.99] border-2 border-dashed border-[#D4AF37]"
                        : isOver
                        ? "bg-[#FAF2E8] border-t-2 border-[#D4AF37] shadow-inner"
                        : "hover:bg-stone-50/90"
                    }`}
                  >
                    {/* Drag Handle & Order Badge */}
                    <td className="py-4 pl-4 pr-1 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div
                          className="p-1 rounded text-stone-400 group-hover:text-[#4A0A10] group-hover:bg-stone-200/60 transition-colors"
                          title="Arrastra para reordenar"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-stone-100 text-stone-600 border border-stone-200/80 group-hover:bg-[#4A0A10]/10 group-hover:text-[#4A0A10] transition-colors">
                          #{orderNumber}
                        </span>
                      </div>
                    </td>

                    {/* Checkbox */}
                    <td className="py-4 px-3 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300 text-[#4A0A10] focus:ring-[#4A0A10]"
                        readOnly
                      />
                    </td>

                    {/* Marcas Aliadas */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-2xs">
                          {biz.logoUrl ? (
                            <img
                              src={biz.logoUrl}
                              alt={biz.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#F5ECE1] text-[#4A0A10] font-serif font-bold text-sm flex items-center justify-center">
                              {biz.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-stone-900">{biz.name}</p>
                            {!biz.isActive && (
                              <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-stone-100 text-stone-500">
                                Inactivo
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500">
                            {biz.category?.name || "General"} • {biz.discountSummary}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Acción */}
                    <td className="py-4 px-6 text-right space-x-2">
                      {/* Botón Editar (Dorado) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(biz);
                        }}
                        className="px-4 py-1.5 rounded-md bg-[#D4AF37] hover:bg-[#C59B27] text-white font-medium text-xs shadow-sm transition-colors cursor-pointer"
                      >
                        Editar
                      </button>

                      {/* Botón Desactivar / Activar */}
                      {biz.isActive ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(biz.id, biz.isActive);
                          }}
                          className="px-4 py-1.5 rounded-md bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4] hover:bg-[#FBD5D5] font-medium text-xs transition-colors cursor-pointer"
                          title="Haz clic para desactivar"
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(biz.id, biz.isActive);
                          }}
                          className="px-4 py-1.5 rounded-md bg-[#DEF7EC] text-[#03543F] border border-[#BCF0DA] hover:bg-[#BCF0DA] font-medium text-xs transition-colors cursor-pointer"
                          title="Haz clic para activar"
                        >
                          Activar
                        </button>
                      )}

                      {/* Botón Eliminar secundario */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(biz.id, biz.name);
                        }}
                        className="p-1.5 text-stone-400 hover:text-red-600 transition-colors inline-block cursor-pointer"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="py-12 text-center text-stone-400">
                  No hay comercios aliados registrados aún.
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

      {/* Modal Dialog: Tamaño y ergonomía visual perfeccionados */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop: No se cierra al hacer clic afuera */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" />

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-200 border border-stone-200 max-h-[88vh] flex flex-col">
            {/* Header del modal */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4 flex-shrink-0">
              <h3 className="text-base font-bold text-stone-900">
                {editingBusiness ? "Editar Comercio Aliado" : "Registrar Nuevo Comercio Aliado"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex-shrink-0">
                {error}
              </div>
            )}

            {/* Formulario con scroll independiente */}
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Nombre de la Empresa */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Master Ulala"
                  className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#4A0A10] focus:border-[#4A0A10]"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Categoría
                </label>
                <div className="relative">
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full appearance-none bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#4A0A10] focus:border-[#4A0A10] pr-8"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Porcentaje / Detalle de Descuento */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Porcentaje/Detalle de Descuento
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    value={formData.discountSummary}
                    onChange={(e) => setFormData({ ...formData, discountSummary: e.target.value })}
                    placeholder="15% de Descuento en Lavado de Vehículos"
                    className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#4A0A10] focus:border-[#4A0A10] pr-8"
                  />
                  <span className="absolute right-3 text-xs text-stone-400 font-bold">%</span>
                </div>
              </div>

              {/* Cargar Logotipo con Conversión a WebP y Ajuste */}
              <div className="bg-stone-50/70 p-3.5 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-stone-800">
                    Logotipo Oficial del Comercio
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                    Optimizado en WebP
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl border border-stone-300 bg-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs">
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Logo preview"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#4A0A10]">
                        <ImageIcon className="w-5 h-5 text-stone-300" />
                        <span className="text-[9px] text-stone-400">Sin logo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      onClick={() => setIsCropperOpen(true)}
                      className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-[#FAF2E8] hover:bg-[#F3E5D0] text-[#800C1B] text-xs font-semibold border border-[#D4AF37]/40 shadow-xs cursor-pointer transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>{formData.logoUrl ? "Cambiar y Ajustar Logo (WebP)" : "Subir Logo PNG/JPG (Convertir a WebP)"}</span>
                    </button>

                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logoUrl: "" })}
                        className="text-[11px] text-stone-400 hover:text-red-600 cursor-pointer block text-left"
                      >
                        Quitar logotipo actual
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Código Propio del Comercio (Validación de Canje Presencial) */}
              <div className="bg-[#FAF2E8]/40 p-3.5 rounded-xl border border-[#D4AF37]/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <Key className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <label className="block text-xs font-bold text-stone-900">
                    Código de Validación del Local
                  </label>
                </div>
                <p className="text-[11px] text-stone-600 mb-2 leading-relaxed">
                  Código secreto que el cajero o encargado de este local ingresará en el celular del socio para validar y registrar el canje de la promoción.
                </p>
                <input
                  type="text"
                  required
                  value={formData.storeCode}
                  onChange={(e) => setFormData({ ...formData, storeCode: e.target.value.toUpperCase().trim() })}
                  placeholder="Ej: 1234, ULALA1, CAFE01"
                  className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs font-mono font-bold tracking-wider text-[#4A0A10] focus:outline-none focus:ring-1 focus:ring-[#4A0A10]"
                />
              </div>

              {/* Vigencia y WhatsApp en 2 columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Vigencia de la Promoción
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#4A0A10]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    WhatsApp del Comercio
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder="+51999999999"
                    className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#4A0A10]"
                  />
                </div>
              </div>

              {/* Condiciones / Términos de Uso */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Condiciones y Restricciones
                </label>
                <div className="space-y-1.5 mb-2 max-h-28 overflow-y-auto pr-1">
                  {formData.terms.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[11px] bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-md"
                    >
                      <span className="truncate text-stone-700">• {t.description}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTerm(idx)}
                        className="text-stone-400 hover:text-red-500 ml-2 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTermDescription}
                    onChange={(e) => setNewTermDescription(e.target.value)}
                    placeholder="Ej: Válido de Lunes a Jueves con previa reserva"
                    className="flex-1 bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTerm();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTerm}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold border border-stone-300 cursor-pointer"
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              {/* Botón Dorado "Guardar y Publicar" fijo al fondo */}
              <div className="pt-3 border-t border-stone-100 flex-shrink-0">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-[#C59B27] via-[#E5C058] to-[#C59B27] hover:brightness-105 text-[#2F070E] font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Guardando..." : "Guardar y Publicar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Ajustar y Optimizar Logo en WebP */}
      <LogoCropperModal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        onSave={(url) => setFormData((prev) => ({ ...prev, logoUrl: url }))}
        currentLogoUrl={formData.logoUrl}
        businessName={formData.name || "Comercio Aliado"}
      />
    </div>
  );
}
