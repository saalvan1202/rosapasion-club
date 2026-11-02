"use client";

import React, { useState, useTransition } from "react";
import { Plus, Trash2, Edit2, Sparkles, Coffee, HeartPulse, Car, Cake, X, Search } from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "@/actions/category";
import { Pagination } from "@/components/ui/pagination";

interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  order: number;
  _count?: {
    businesses: number;
  };
}

interface CategoryManagerProps {
  initialCategories: Category[];
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Pagination (5 por página)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    iconName: "Sparkles",
    order: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredCategories = categories.filter((cat) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return cat.name.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q);
  });

  const totalItems = filteredCategories.length;
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: "",
      iconName: "Sparkles",
      order: categories.length + 1,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      iconName: cat.iconName,
      order: cat.order,
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
      slug: editingCategory ? prev.slug : slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      if (editingCategory) {
        const res = await updateCategory(editingCategory.id, formData);
        if (res.success && res.category) {
          setCategories((prev) =>
            prev.map((c) => (c.id === editingCategory.id ? { ...c, ...res.category } : c))
          );
          setIsModalOpen(false);
        } else {
          setError(res.message || "Error al actualizar categoría");
        }
      } else {
        const res = await createCategory(formData);
        if (res.success && res.category) {
          setCategories((prev) => [...prev, { ...res.category, _count: { businesses: 0 } }]);
          setIsModalOpen(false);
        } else {
          setError(res.message || "Error al crear categoría");
        }
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la categoría "${name}"?`)) return;

    startTransition(async () => {
      const res = await deleteCategory(id);
      if (res.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert(res.message || "Error al eliminar categoría");
      }
    });
  };

  const renderIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "coffee":
        return <Coffee className="w-4 h-4 text-[#D4AF37]" />;
      case "heartpulse":
        return <HeartPulse className="w-4 h-4 text-[#D4AF37]" />;
      case "car":
        return <Car className="w-4 h-4 text-[#D4AF37]" />;
      case "cake":
        return <Cake className="w-4 h-4 text-[#D4AF37]" />;
      case "sparkles":
      default:
        return <Sparkles className="w-4 h-4 text-[#D4AF37]" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Categorías de Comercios
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Rubros visuales en el portal móvil (Lavado de autos, Cafetería, Pastelería, Odontología, etc.)
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#4A0A10] hover:bg-[#580A15] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
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
          placeholder=""
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

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[550px] sm:min-w-full">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-700 font-semibold">
              <th className="py-3 px-4 w-12 text-center">Ícono</th>
              <th className="py-3 px-6 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                Nombre
              </th>
              <th className="py-3 px-6 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                Slug
              </th>
              <th className="py-3 px-6 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                Comercios
              </th>
              <th className="py-3 px-6 text-right text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-800">
            {paginatedCategories.length > 0 ? (
              paginatedCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-center">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto">
                      {renderIcon(cat.iconName)}
                    </div>
                  </td>
                  <td className="py-3.5 px-6 font-bold text-stone-900">{cat.name}</td>
                  <td className="py-3.5 px-6 font-mono text-stone-500">{cat.slug}</td>
                  <td className="py-3.5 px-6">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-stone-100 text-stone-700 border border-stone-200">
                      {cat._count?.businesses ?? 0} marcas
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="px-3.5 py-1.5 rounded-md bg-[#D4AF37] hover:bg-[#C59B27] text-white font-medium text-xs shadow-sm transition-colors cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1.5 text-stone-400 hover:text-red-600 transition-colors inline-block cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-stone-400">
                  No se encontraron categorías registradas.
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop: No se cierra al hacer clic afuera */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-7 z-10 border border-stone-200 animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4 flex-shrink-0">
              <h3 className="text-base font-bold text-stone-900">
                {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
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
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre de la Categoría
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder=""
                  className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#4A0A10]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder=""
                  className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 font-mono focus:outline-none focus:ring-1 focus:ring-[#4A0A10]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Ícono
                  </label>
                  <select
                    value={formData.iconName}
                    onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none"
                  >
                    <option value="Sparkles">Sparkles (General / Belleza)</option>
                    <option value="Coffee">Coffee (Cafetería)</option>
                    <option value="Cake">Cake (Pastelería)</option>
                    <option value="Car">Car (Lavado de Vehículos)</option>
                    <option value="HeartPulse">HeartPulse (Salud / Dental)</option>
                    <option value="Building2">Building2 (Arquitectura / Diseño)</option>
                    <option value="Scale">Scale (Asesoría Legal)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Orden
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none"
                  />
                </div>
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
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-[#C59B27] via-[#E5C058] to-[#C59B27] text-[#2F070E] font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer hover:brightness-105"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
