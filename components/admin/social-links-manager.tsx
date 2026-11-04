"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Share2,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Power,
  Sparkles,
} from "lucide-react";

export interface SocialPostRow {
  id: string;
  platform: "TIKTOK" | "FACEBOOK" | "INSTAGRAM" | string;
  url: string;
  title?: string | null;
  caption?: string | null;
  isActive: boolean;
  createdAt: string;
}

interface SocialLinksManagerProps {
  initialPosts: SocialPostRow[];
}

export function SocialLinksManager({ initialPosts }: SocialLinksManagerProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<SocialPostRow[]>(initialPosts || []);
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<"TIKTOK" | "FACEBOOK" | "INSTAGRAM">("FACEBOOK");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Sincronizar posts cuando cambien los initialPosts desde el servidor
  useEffect(() => {
    if (initialPosts) {
      setPosts(initialPosts);
    }
  }, [initialPosts]);

  // Auto-detectar plataforma al pegar o escribir la URL
  const handleUrlChange = (value: string) => {
    setUrl(value);
    const clean = value.toLowerCase();
    if (clean.includes("tiktok.com")) {
      setPlatform("TIKTOK");
    } else if (clean.includes("instagram.com")) {
      setPlatform("INSTAGRAM");
    } else if (clean.includes("facebook.com") || clean.includes("fb.watch")) {
      setPlatform("FACEBOOK");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setMessage({ text: "Ingresa una URL válida de la publicación", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/social-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          platform,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al registrar la publicación");
      }

      setPosts((prev) => [data.post, ...prev]);
      setUrl("");
      setMessage({ text: "¡Publicación agregada con éxito!", type: "success" });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Error al guardar el enlace", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este enlace de publicación?")) return;

    setDeletingId(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/social-posts?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo eliminar");
      }

      setPosts((prev) => prev.filter((p) => p.id !== id));
      setMessage({ text: "Publicación eliminada correctamente", type: "success" });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Error al eliminar", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    setMessage(null);

    try {
      const res = await fetch("/api/social-posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          isActive: !currentStatus,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo actualizar");
      }

      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: !currentStatus } : p))
      );
      setMessage({
        text: `Publicación ${!currentStatus ? "activada" : "desactivada"}`,
        type: "success",
      });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Error al cambiar estado", type: "error" });
    } finally {
      setTogglingId(null);
    }
  };

  const getPlatformBadge = (p: string) => {
    const plat = (p || "").toUpperCase();
    if (plat === "FACEBOOK") {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#1877F2]/15 text-[#1877F2] border border-[#1877F2]/30 flex items-center gap-1.5 w-fit">
          <span className="w-2 h-2 rounded-full bg-[#1877F2]" />
          Facebook
        </span>
      );
    }
    if (plat === "INSTAGRAM") {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E4405F]/15 text-[#E4405F] border border-[#E4405F]/30 flex items-center gap-1.5 w-fit">
          <span className="w-2 h-2 rounded-full bg-[#E4405F]" />
          Instagram
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-stone-900 text-white border border-stone-700 flex items-center gap-1.5 w-fit shadow-xs">
        <span className="w-2 h-2 rounded-full bg-[#00f2fe]" />
        TikTok
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Banner Notificación */}
      {message && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-red-50 border-red-300 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-stone-400 hover:text-stone-600 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* FORMULARIO DE REGISTRO RÁPIDO */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#4A0A10]" />
              Conectar Nueva Publicación Oficial
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Pega el enlace de la publicación más reciente de TikTok, Facebook o Instagram para incrustarla en la página web.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Selección de Red */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Red Social
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#4A0A10]"
              >
                <option value="FACEBOOK">Facebook</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="TIKTOK">TikTok</option>
              </select>
            </div>

            {/* Input URL */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                URL del Post / Video
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  placeholder="https://www.facebook.com/... o https://www.instagram.com/p/... o https://www.tiktok.com/@.../video/..."
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#4A0A10]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-[#4A0A10] hover:bg-[#630D15] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{loading ? "Guardando..." : "Publicar"}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* TABLA DE PUBLICACIONES ACTIVAS */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-stone-900">
              Publicaciones Configuradas ({posts.length})
            </h4>
            <p className="text-xs text-stone-500">
              En la página web se mostrará de forma destacada (3x1) la última publicación activa registrada de cada red.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-600 font-bold select-none">
                <th className="py-3 px-4 w-36">Red Social</th>
                <th className="py-3 px-4">Enlace de la Publicación</th>
                <th className="py-3 px-4 w-28 text-center">Estado</th>
                <th className="py-3 px-4 w-28 text-center">Fecha</th>
                <th className="py-3 px-4 w-32 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-stone-50/80 transition-colors">
                    {/* Badge Red */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getPlatformBadge(post.platform)}
                    </td>

                    {/* URL */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-stone-700 max-w-md truncate">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#4A0A10] hover:underline flex items-center gap-1.5"
                        title={post.url}
                      >
                        <span className="truncate">{post.url}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0 text-stone-400" />
                      </a>
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {post.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ● Activa
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-500 border border-stone-200">
                          ○ Inactiva
                        </span>
                      )}
                    </td>

                    {/* Fecha */}
                    <td className="py-3.5 px-4 text-center text-stone-500 whitespace-nowrap text-[11px]">
                      {post.createdAt
                        ? new Date(post.createdAt).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Hoy"}
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón Activar / Pausar */}
                        <button
                          onClick={() => handleToggle(post.id, post.isActive)}
                          disabled={togglingId === post.id}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            post.isActive
                              ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          }`}
                          title={post.isActive ? "Pausar publicación" : "Activar publicación"}
                        >
                          {togglingId === post.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Power className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Botón Eliminar */}
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={deletingId === post.id}
                          className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer"
                          title="Eliminar enlace"
                        >
                          {deletingId === post.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400 text-xs">
                    No hay publicaciones registradas aún. Agrega la primera en el formulario superior.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

