"use client";

import React from "react";
import { SocialPostItem } from "@/actions/social";
import { SocialButtons } from "@/components/social/social-buttons";
import {
  Sparkles,
  Heart,
  MessageCircle,
  Eye,
  ExternalLink,
  Calendar,
} from "lucide-react";

interface SocialFeedSectionProps {
  posts: SocialPostItem[];
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
}

export function SocialFeedSection({
  posts,
  facebookUrl = "https://www.facebook.com/Rosapasion",
  instagramUrl = "https://www.instagram.com/rosapasion_tarapoto",
  tiktokUrl = "https://www.tiktok.com/@rosapasion.tarapoto",
}: SocialFeedSectionProps) {
  // Obtener la publicación más reciente real para cada plataforma (3x1)
  const latestFb = posts.find((p) => p.platform.toUpperCase() === "FACEBOOK") || {
    id: "fb-default",
    platform: "FACEBOOK",
    title: "¡Nuevas Marcas Aliadas se suman al Club!",
    caption: "¡Seguimos creciendo para darte lo mejor! Presentando tu tarjeta de Rosa Pasión Club accedes a descuentos exclusivos en cafeterías, restaurantes, spa y más en toda la ciudad. Visita nuestra página oficial de Facebook.",
    mediaUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80",
    postUrl: facebookUrl,
    authorName: "Rosa Pasión",
    authorHandle: "@Rosapasion",
    authorAvatar: "/logo.png",
    likesCount: 340,
    commentsCount: 28,
    viewsCount: 3800,
    publishedAt: new Date().toISOString(),
    order: 1,
    isActive: true,
  };

  const latestIg = posts.find((p) => p.platform.toUpperCase() === "INSTAGRAM") || {
    id: "ig-default",
    platform: "INSTAGRAM",
    title: "Colección Exclusiva de Rosas & Detalles",
    caption: "🌹 ¿Sabías que con tu membresía de Rosa Pasión Club tienes un 15% de descuento en todos nuestros arreglos florales y cajas de lujo? Ven y sorprende a quien más amas. #RosaPasion #Tarapoto",
    mediaUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    postUrl: instagramUrl,
    authorName: "Rosa Pasión Florería",
    authorHandle: "@rosapasion_tarapoto",
    authorAvatar: "/logo.png",
    likesCount: 520,
    commentsCount: 42,
    viewsCount: 4600,
    publishedAt: new Date().toISOString(),
    order: 2,
    isActive: true,
  };

  const latestTt = posts.find((p) => p.platform.toUpperCase() === "TIKTOK") || {
    id: "tt-default",
    platform: "TIKTOK",
    title: "Preparando una sorpresa gigante en Tarapoto ✨",
    caption: "¡Mira el detrás de cámaras de este ramo buchón entregado hoy! Recuerda mostrar tu tarjeta Rosa Pasión Club para beneficios exclusivos. 💐❤️ #TarapotoSanMartin #RamosBuchones",
    mediaUrl: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80",
    postUrl: tiktokUrl,
    authorName: "Rosa Pasión Oficial",
    authorHandle: "@rosapasion.tarapoto",
    authorAvatar: "/logo.png",
    likesCount: 1850,
    commentsCount: 95,
    viewsCount: 24500,
    publishedAt: new Date().toISOString(),
    order: 3,
    isActive: true,
  };

  const socialColumns = [
    {
      post: latestFb,
      platformName: "Facebook",
      handle: "@Rosapasion",
      profileUrl: facebookUrl,
      badgeClass: "bg-[#1877F2] text-white",
      btnClass: "bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-md shadow-[#1877F2]/20",
      accentBorder: "group-hover:border-[#1877F2]",
      icon: (
        <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      post: latestIg,
      platformName: "Instagram",
      handle: "@rosapasion_tarapoto",
      profileUrl: instagramUrl,
      badgeClass: "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white",
      btnClass: "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:brightness-110 shadow-md shadow-[#FD1D1D]/20",
      accentBorder: "group-hover:border-[#FD1D1D]",
      icon: (
        <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      post: latestTt,
      platformName: "TikTok",
      handle: "@rosapasion.tarapoto",
      profileUrl: tiktokUrl,
      badgeClass: "bg-black text-white border border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]",
      btnClass: "bg-black hover:bg-neutral-900 text-white border border-cyan-400/50 hover:border-cyan-400 shadow-md shadow-cyan-400/10",
      accentBorder: "group-hover:border-cyan-400/80",
      icon: (
        <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="redes-sociales" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full scroll-mt-20">
      {/* Header Container */}
      <div className="bg-gradient-to-b from-[#140508] via-[#1A0204] to-[#0D0D0D] border border-[#8C0303]/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden mb-8">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#F20519]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8C0303]/40 border border-[#F20519]/40 text-[#F7EDC4] text-[11px] font-bold uppercase tracking-wider mb-2.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#F20519]" />
              <span>Comunidad & Redes Sociales</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Síguenos en nuestras <span className="gold-gradient-text">Redes Oficiales</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl leading-relaxed">
              Descubre nuestras publicaciones y videos más recientes en tiempo real en Facebook, Instagram y TikTok.
            </p>
          </div>

          {/* Botones de Redes Sociales con diseño exacto de referencia */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-xs text-stone-300 font-medium">Perfiles Oficiales:</span>
            <SocialButtons
              facebookUrl={facebookUrl}
              instagramUrl={instagramUrl}
              tiktokUrl={tiktokUrl}
              size="lg"
            />
          </div>
        </div>
      </div>

      {/* Grid Exacto de 3 x 1 (1 Columna por Red Social: Facebook, Instagram, TikTok) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {socialColumns.map((col) => {
          const post = col.post;
          return (
            <div
              key={col.platformName}
              className={`rounded-3xl bg-gradient-to-b from-[#140508] via-[#1A0204] to-[#0D0D0D] border border-[#8C0303]/40 overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-xl group hover:shadow-[0_10px_35px_rgba(242,5,25,0.2)] ${col.accentBorder}`}
            >
              <div>
                {/* Header of the post */}
                <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#8C0303]/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={post.authorAvatar || "/logo.png"}
                      alt={col.platformName}
                      className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]/50 shadow-xs flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-[#F7EDC4] transition">
                        {post.authorName}
                      </p>
                      <p className="text-[11px] text-stone-400 truncate">
                        {col.handle}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs flex items-center gap-1.5 flex-shrink-0 ${col.badgeClass}`}>
                    {col.icon}
                    <span>{col.platformName}</span>
                  </span>
                </div>

                {/* Media Container (16:10 or 4:3 Aspect Ratio) */}
                <a
                  href={post.postUrl || col.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative aspect-[4/3] bg-black overflow-hidden group/media cursor-pointer"
                >
                  <img
                    src={post.mediaUrl}
                    alt={post.title || post.caption.slice(0, 40)}
                    className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover/media:opacity-30 transition-opacity" />

                  {/* Icon badge floating on top right of image */}
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-md">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </a>

                {/* Caption / Content */}
                <div className="p-4 sm:p-5 space-y-3">
                  {post.title && (
                    <h3 className="font-serif font-bold text-white text-base leading-snug">
                      {post.title}
                    </h3>
                  )}
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {post.caption}
                  </p>
                </div>
              </div>

              {/* Footer with Engagement Stats and CTA */}
              <div className="p-4 sm:p-5 pt-0 border-t border-[#8C0303]/20 mt-2 space-y-3">
                {/* Stats */}
                <div className="flex items-center justify-between text-[11px] text-stone-400 pt-3">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 hover:text-rose-400 transition">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>{post.likesCount || 0}</span>
                    </span>
                    <span className="flex items-center gap-1.5 hover:text-sky-400 transition">
                      <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
                      <span>{post.commentsCount || 0}</span>
                    </span>
                    {post.viewsCount && post.viewsCount > 0 && (
                      <span className="flex items-center gap-1.5 hover:text-amber-400 transition">
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>{post.viewsCount}</span>
                      </span>
                    )}
                  </div>

                  <span className="flex items-center gap-1 text-[10px] text-stone-500">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(post.publishedAt).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </span>
                </div>

                {/* Direct CTA Button */}
                <a
                  href={post.postUrl || col.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 ${col.btnClass} active:scale-98 cursor-pointer`}
                >
                  <span>Ver en {col.platformName}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
