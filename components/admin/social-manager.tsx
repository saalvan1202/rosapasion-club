"use client";

import React, { useState, useTransition } from "react";
import { SocialPostItem, createSocialPost, updateSocialPost, deleteSocialPost } from "@/actions/social";
import { SocialButtons } from "@/components/social/social-buttons";
import {
  Share2,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Upload,
  Loader2,
  Heart,
  MessageCircle,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
} from "lucide-react";

interface SocialManagerProps {
  initialPosts: SocialPostItem[];
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
}

export function SocialManager({
  initialPosts,
  facebookUrl = "https://www.facebook.com/rosapasiontarapoto",
  instagramUrl = "https://www.instagram.com/rosapasiontarapoto",
  tiktokUrl = "https://www.tiktok.com/@rosapasiontarapoto",
}: SocialManagerProps) {
  const [posts, setPosts] = useState<SocialPostItem[]>(initialPosts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPostItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    platform: "INSTAGRAM",
    title: "",
    caption: "",
    mediaUrl: "",
    postUrl: "",
    authorName: "Rosa Pasión",
    authorHandle: "@rosapasiontarapoto",
    likesCount: 150,
    commentsCount: 20,
    viewsCount: 1500,
    order: 0,
    isActive: true,
  });

  const handleOpenAdd = () => {
    setEditingPost(null);
    setFormData({
      platform: "INSTAGRAM",
      title: "",
      caption: "",
      mediaUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
      postUrl: instagramUrl,
      authorName: "Rosa Pasión Florería",
      authorHandle: "@rosapasiontarapoto",
      likesCount: 100,
      commentsCount: 15,
      viewsCount: 1200,
      order: posts.length + 1,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (post: SocialPostItem) => {
    setEditingPost(post);
    setFormData({
      platform: post.platform,
      title: post.title || "",
      caption: post.caption,
      mediaUrl: post.mediaUrl,
      postUrl: post.postUrl,
      authorName: post.authorName,
      authorHandle: post.authorHandle || "@rosapasiontarapoto",
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      viewsCount: post.viewsCount || 0,
      order: post.order,
      isActive: post.isActive,
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (json.url) {
        setFormData((prev) => ({ ...prev, mediaUrl: json.url }));
      }
    } catch (err) {
      console.error("Error al subir imagen:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (editingPost) {
          const res = await updateSocialPost(editingPost.id, formData);
          if (res.success && res.post) {
            setPosts((prev) =>
              prev.map((p) => (p.id === editingPost.id ? (res.post as any) : p))
            );
            setStatusMessage("¡Publicación actualizada correctamente!");
            setIsError(false);
            setIsModalOpen(false);
          } else {
            setStatusMessage("Error al actualizar la publicación.");
            setIsError(true);
          }
        } else {
          const res = await createSocialPost(formData);
          if (res.success && res.post) {
            setPosts((prev) => [res.post as any, ...prev]);
            setStatusMessage("¡Nueva publicación añadida con éxito!");
            setIsError(false);
            setIsModalOpen(false);
          } else {
            setStatusMessage("Error al crear la publicación.");
            setIsError(true);
          }
        }
      } catch (err: any) {
        setStatusMessage(err.message || "Ocurrió un error inesperado.");
        setIsError(true);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta publicación de redes sociales?")) return;
    startTransition(async () => {
      try {
        const res = await deleteSocialPost(id);
        if (res.success) {
          setPosts((prev) => prev.filter((p) => p.id !== id));
          setStatusMessage("Publicación eliminada.");
          setIsError(false);
        }
      } catch (err: any) {
        setStatusMessage(err.message || "Error al eliminar.");
        setIsError(true);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-gradient-to-r from-[#8C0303] to-[#F20519] text-white shadow-xs">
              <Share2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-stone-900">
              Redes Sociales & Publicaciones
            </h1>
          </div>
          <p className="text-xs text-stone-500">
            Gestiona los enlaces oficiales y las publicaciones que se mostrarán en la página web.
          </p>
        </div>

        {/* Botones de referencia con enlaces oficiales y Botón Agregar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider hidden sm:inline">
              Accesos:
            </span>
            <SocialButtons
              facebookUrl={facebookUrl}
              instagramUrl={instagramUrl}
              tiktokUrl={tiktokUrl}
              size="md"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8C0303] via-[#B80404] to-[#F20519] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-2 cursor-pointer transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Publicación</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between shadow-sm animate-in fade-in ${
            isError
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-emerald-50 border border-emerald-200 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {isError ? (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-stone-400 hover:text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid of Existing Posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.map((post) => {
          const isIg = post.platform.toUpperCase() === "INSTAGRAM";
          const isTt = post.platform.toUpperCase() === "TIKTOK";
          const isFb = post.platform.toUpperCase() === "FACEBOOK";

          return (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                {/* Media Preview */}
                <div className="relative aspect-[16/10] bg-stone-900 overflow-hidden">
                  <img
                    src={post.mediaUrl}
                    alt={post.title || post.caption}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${
                        isIg
                          ? "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737]"
                          : isTt
                          ? "bg-black border border-cyan-400"
                          : "bg-[#1877F2]"
                      }`}
                    >
                      {post.platform}
                    </span>
                    {!post.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-600 text-white">
                        Oculta
                      </span>
                    )}
                  </div>

                  <a
                    href={post.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition"
                    title="Ver en red social"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={post.authorAvatar || "/logo.png"}
                      alt={post.authorName}
                      className="w-6 h-6 rounded-full object-cover border border-stone-200"
                    />
                    <span className="text-xs font-bold text-stone-800">
                      {post.authorName}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {post.authorHandle}
                    </span>
                  </div>

                  {post.title && (
                    <h3 className="text-sm font-bold text-stone-900 leading-snug">
                      {post.title}
                    </h3>
                  )}

                  <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                    {post.caption}
                  </p>
                </div>
              </div>

              {/* Footer / Stats & Actions */}
              <div className="p-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-stone-500 text-[11px]">
                  <span className="flex items-center gap-1 text-rose-600">
                    <Heart className="w-3.5 h-3.5" />
                    <span>{post.likesCount || 0}</span>
                  </span>
                  <span className="flex items-center gap-1 text-sky-600">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{post.commentsCount || 0}</span>
                  </span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{post.viewsCount || 0}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(post)}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition"
                    title="Editar publicación"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition"
                    title="Eliminar publicación"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">
                {editingPost ? "Editar Publicación" : "Nueva Publicación de Red Social"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Platform Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Plataforma
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["INSTAGRAM", "TIKTOK", "FACEBOOK"].map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setFormData({ ...formData, platform: plat })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.platform === plat
                          ? "bg-[#8C0303] text-white shadow-xs ring-2 ring-[#F20519]/40"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Caption */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Título (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej. Ramo Buchón de 100 Rosas"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C0303]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Descripción / Texto de la publicación *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  placeholder="Escribe la descripción o copia el texto del post..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C0303]"
                />
              </div>

              {/* Media URL / Upload */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Imagen o Portada *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    required
                    value={formData.mediaUrl}
                    onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                    placeholder="https://... URL de la imagen"
                    className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C0303]"
                  />
                  <label className="px-3 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 flex-shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? "Subiendo..." : "Subir"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Direct Post URL */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Enlace directo a la publicación en la red social *
                </label>
                <input
                  type="url"
                  required
                  value={formData.postUrl}
                  onChange={(e) => setFormData({ ...formData, postUrl: e.target.value })}
                  placeholder="https://instagram.com/p/... o tiktok.com/@..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C0303]"
                />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Likes
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.likesCount}
                    onChange={(e) => setFormData({ ...formData, likesCount: Number(e.target.value) })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Comentarios
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.commentsCount}
                    onChange={(e) => setFormData({ ...formData, commentsCount: Number(e.target.value) })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Vistas
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.viewsCount}
                    onChange={(e) => setFormData({ ...formData, viewsCount: Number(e.target.value) })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-[#8C0303] focus:ring-[#8C0303] w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-stone-700">
                    Visible en la página web
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#8C0303] to-[#F20519] text-white font-bold text-xs shadow-md hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingPost ? "Guardar Cambios" : "Publicar"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
